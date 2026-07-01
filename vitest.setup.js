import { beforeAll, afterAll, vi } from 'vitest';

const originalCwd = process.cwd;
const originalExit = process.exit;
const originalKill = process.kill;
const originalFetch = globalThis.fetch;

// Use dynamic imports inside the vi.mock factory to load your strict isolation files
vi.mock('fs', async () => await import('./__mocks__/fs.js'));
vi.mock('node:fs', async () => await import('./__mocks__/fs.js'));
vi.mock('fs/promises', async () => await import('./__mocks__/fs.js'));
vi.mock('node:fs/promises', async () => await import('./__mocks__/fs.js'));

vi.mock('child_process', async () => await import('./__mocks__/child_process.js'));
vi.mock('node:child_process', async () => await import('./__mocks__/child_process.js'));

vi.mock('worker_threads', async () => await import('./__mocks__/worker_threads.js'));
vi.mock('node:worker_threads', async () => await import('./__mocks__/worker_threads.js'));

vi.mock('vm', async () => await import('./__mocks__/vm.js'));
vi.mock('node:vm', async () => await import('./__mocks__/vm.js'));

vi.mock('os', async () => await import('./__mocks__/os.js'));
vi.mock('node:os', async () => await import('./__mocks__/os.js'));

vi.mock('module', async () => await import('./__mocks__/module.js'));
vi.mock('node:module', async () => await import('./__mocks__/module.js'));

const SECURITY_MAP = {
   'fs': "./__mocks__/fs.js",
   'fs/promises': "./__mocks__/fs.js",
   'child_process': "./__mocks__/child_process.js",
   'worker_threads': "./__mocks__/worker_threads.js",
   'vm': "./__mocks__/vm.js",
   'os': "./__mocks__/os.js",
   'module': "./__mocks__/module.js"
}
const originalImportActual = vi.importActual;
vi.importActual = (m) => {
   if (undefined !== SECURITY_MAP[m]) m = SECURITY_MAP[m];
   else if (undefined != SECURITY_MAP[`node:${m}`]) m = SECURITY_MAP[m.substring("node:".length)];
   return originalImportActual.apply(vi, [m]);
}
beforeAll(() => {
   // 1. Wipe out the real environment variables
   process.env = { NODE_ENV: 'test', VITEST: 'true' };

   // 2. Prevent absolute host path leaks by returning a generic string
   process.cwd = vi.fn(() => '/mocked/project/root');

   // 3. Prevent a test from crashing the runner
   process.exit = vi.fn(() => { throw new Error('[Strict Isolation] process.exit() called.'); });
   process.kill = vi.fn(() => { throw new Error('[Strict Isolation] process.kill() called.'); });

   // 4. Disable global fetch to stop outbound network leaks
   globalThis.fetch = vi.fn(() => {
      throw new Error('[Strict Isolation] Outbound HTTP requests via fetch() are forbidden.');
   });
});

afterAll(() => {
   process.cwd = originalCwd;
   process.exit = originalExit;
   process.kill = originalKill;
   globalThis.fetch = originalFetch;
});
