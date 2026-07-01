import { vi } from 'vitest';
import { constants, EOL, devNull } from 'node:os';

const throwError = (method) => {
   throw new Error(`[Strict Isolation] os.${method}() is forbidden in unit tests.`);
};

// ============================================================================
// 1. DANGEROUS METHODS (Host Info Leaks & Side Effects)
// ============================================================================
export const arch = vi.fn(() => throwError('arch'));
export const availableParallelism = vi.fn(() => throwError('availableParallelism'));
export const cpus = vi.fn(() => throwError('cpus'));
export const endianness = vi.fn(() => throwError('endianness'));
export const freemem = vi.fn(() => throwError('freemem'));
export const getPriority = vi.fn(() => throwError('getPriority'));
export const homedir = vi.fn(() => throwError('homedir'));
export const hostname = vi.fn(() => throwError('hostname'));
export const loadavg = vi.fn(() => throwError('loadavg'));
export const machine = vi.fn(() => throwError('machine'));
export const networkInterfaces = vi.fn(() => throwError('networkInterfaces'));
export const platform = vi.fn(() => throwError('platform'));
export const release = vi.fn(() => throwError('release'));
export const setPriority = vi.fn(() => throwError('setPriority'));
export const tmpdir = vi.fn(() => throwError('tmpdir'));
export const totalmem = vi.fn(() => throwError('totalmem'));
export const type = vi.fn(() => throwError('type'));
export const uptime = vi.fn(() => throwError('uptime'));
export const userInfo = vi.fn(() => throwError('userInfo'));
export const version = vi.fn(() => throwError('version'));

// ============================================================================
// 2. SAFE CONSTANTS & STRINGS (No active system probing)
// ============================================================================
// Pass through the standard end-of-line string and null device path 
// so benign cross-platform string formatting doesn't break.
export { constants, EOL, devNull };

// ============================================================================
// 3. DEFAULT EXPORT (For `import os from 'node:os'`)
// ============================================================================
export default {
   // Blocked OS methods
   arch,
   availableParallelism,
   cpus,
   endianness,
   freemem,
   getPriority,
   homedir,
   hostname,
   loadavg,
   machine,
   networkInterfaces,
   platform,
   release,
   setPriority,
   tmpdir,
   totalmem,
   type,
   uptime,
   userInfo,
   version,

   // Safe properties
   constants,
   EOL,
   devNull,
};
