// __mocks__/child_process.js
import { vi } from 'vitest';
import { ChildProcess } from 'node:child_process';

const throwError = (method) => {
   throw new Error(`[Strict Isolation] child_process.${method}() is forbidden in unit tests.`);
};

// ============================================================================
// 1. DANGEROUS METHODS (Process Spawning & Code Execution)
// ============================================================================
export const exec = vi.fn(() => throwError('exec'));
export const execFile = vi.fn(() => throwError('execFile'));
export const execFileSync = vi.fn(() => throwError('execFileSync'));
export const execSync = vi.fn(() => throwError('execSync'));
export const fork = vi.fn(() => throwError('fork'));
export const spawn = vi.fn(() => throwError('spawn'));
export const spawnSync = vi.fn(() => throwError('spawnSync'));

// ============================================================================
// 2. SAFE EXPORTS (Pass-throughs)
// ============================================================================
// Re-exporting the real class ensures type checks and `instanceof` operations 
// in your source code continue to work normally without side effects.
export { ChildProcess };

// ============================================================================
// 3. DEFAULT EXPORT (For `import cp from 'node:child_process'`)
// ============================================================================
export default {
   // Blocked Execution Methods
   exec,
   execFile,
   execFileSync,
   execSync,
   fork,
   spawn,
   spawnSync,

   // Safe Exports
   ChildProcess,
};
