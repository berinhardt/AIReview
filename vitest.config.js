import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default defineConfig({
   resolve: {
      alias: {
         'fs': path.resolve(__dirname, './__mocks__/fs.js'),
         'node:fs': path.resolve(__dirname, './__mocks__/fs.js'),
         'fs/promises': path.resolve(__dirname, './__mocks__/fs.js'),
         'node:fs/promises': path.resolve(__dirname, './__mocks__/fs.js'),
         'child_process': path.resolve(__dirname, './__mocks__/child_process.js'),
         'node:child_process': path.resolve(__dirname, './__mocks__/child_process.js'),
         'worker_threads': path.resolve(__dirname, './__mocks__/worker_threads.js'),
         'node:worker_threads': path.resolve(__dirname, './__mocks__/worker_trheads.js'),
         'vm': path.resolve(__dirname, './__mocks__/vm.js'),
         'node:vm': path.resolve(__dirname, './__mocks__/vm.js'),
         'os': path.resolve(__dirname, './__mocks__/os.js'),
         'node:os': path.resolve(__dirname, './__mocks__/os.js'),
         'module': path.resolve(__dirname, './__mocks__/module.js'),
         'node:module': path.resolve(__dirname, './__mocks__/module.js'),
      }
   },
   test: {
      setupFiles: ['./vitest.setup.js'],
      include: ['tests/**/*.test.js'],
      clearMocks: true,
      restoreMocks: true
   },
});
