import { vi } from 'vitest';
import { constants } from 'node:vm';

const throwError = (method) => {
   throw new Error(`[Strict Isolation] vm.${method}() is forbidden in unit tests.`);
};

// ============================================================================
// 1. DANGEROUS CLASSES (Compilation & Module Evaluation)
// ============================================================================
export class Script {
   constructor() {
      throwError('Script (constructor)');
   }
}

export class Module {
   constructor() {
      throwError('Module (constructor)');
   }
}

export class SourceTextModule {
   constructor() {
      throwError('SourceTextModule (constructor)');
   }
}

export class SyntheticModule {
   constructor() {
      throwError('SyntheticModule (constructor)');
   }
}

// ============================================================================
// 2. DANGEROUS METHODS (Context Creation & Code Execution)
// ============================================================================
export const compileFunction = vi.fn(() => throwError('compileFunction'));
export const createContext = vi.fn(() => throwError('createContext'));
export const isContext = vi.fn(() => throwError('isContext'));
export const measureMemory = vi.fn(() => throwError('measureMemory'));
export const runInContext = vi.fn(() => throwError('runInContext'));
export const runInNewContext = vi.fn(() => throwError('runInNewContext'));
export const runInThisContext = vi.fn(() => throwError('runInThisContext'));

// ============================================================================
// 3. SAFE EXPORTS
// ============================================================================
// Pass through static constants so pure logic checks don't break
export { constants };

// ============================================================================
// 4. DEFAULT EXPORT (For `import vm from 'node:vm'`)
// ============================================================================
export default {
   // Classes
   Script,
   Module,
   SourceTextModule,
   SyntheticModule,

   // Methods
   compileFunction,
   createContext,
   isContext,
   measureMemory,
   runInContext,
   runInNewContext,
   runInThisContext,

   // Constants
   constants,
};
