// __mocks__/module.js
import { vi } from 'vitest';
import { builtinModules, isBuiltin, constants } from 'node:module';

const throwError = (method) => {
   throw new Error(`[Strict Isolation] module.${method}() is forbidden to prevent mock bypasses.`);
};

// ============================================================================
// 1. DANGEROUS BYPASS METHODS (Require creation & Custom Hooks)
// ============================================================================
export const createRequire = vi.fn(() => throwError('createRequire'));
export const register = vi.fn(() => throwError('register'));
export const syncBuiltinESMExports = vi.fn(() => throwError('syncBuiltinESMExports'));

// ============================================================================
// 2. THE MODULE CLASS (Manual compilation)
// ============================================================================
export class Module {
   constructor() {
      throwError('Module (constructor)');
   }
}

// Block the static methods attached to the real Module class just in case
Module.createRequire = createRequire;
Module.register = register;
Module.syncBuiltinESMExports = syncBuiltinESMExports;
Module.builtinModules = builtinModules;
Module.isBuiltin = isBuiltin;

// ============================================================================
// 3. SAFE PASS-THROUGHS (String checks and arrays)
// ============================================================================
export { builtinModules, isBuiltin, constants };

// ============================================================================
// 4. DEFAULT EXPORT (For `import module from 'node:module'`)
// ============================================================================
export default {
   // Blocked bypasses
   createRequire,
   register,
   syncBuiltinESMExports,
   Module,

   // Safe utilities
   builtinModules,
   isBuiltin,
   constants,
};
