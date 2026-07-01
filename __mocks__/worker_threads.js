import { vi } from 'vitest';
import {
   MessageChannel,
   MessagePort,
   BroadcastChannel,
   SHARE_ENV
} from 'node:worker_threads';

const throwError = (method) => {
   throw new Error(`[Strict Isolation] worker_threads.${method}() is forbidden in unit tests.`);
};

// ============================================================================
// 1. DANGEROUS CLASSES & METHODS (Thread Spawning & State Leakage)
// ============================================================================

// Mock the Worker class so it throws the moment a test tries to instantiate it
export class Worker {
   constructor() {
      throwError('Worker (constructor)');
   }
}

export const getEnvironmentData = vi.fn(() => throwError('getEnvironmentData'));
export const setEnvironmentData = vi.fn(() => throwError('setEnvironmentData'));
export const markAsUntransferable = vi.fn(() => throwError('markAsUntransferable'));
export const moveMessagePortToContext = vi.fn(() => throwError('moveMessagePortToContext'));
export const receiveMessageOnPort = vi.fn(() => throwError('receiveMessageOnPort'));

// ============================================================================
// 2. SAFE CONSTANTS (Standard defaults for the main thread)
// ============================================================================
export const isMainThread = true;
export const parentPort = null;
export const threadId = 0;
export const workerData = null;

// ============================================================================
// 3. SAFE CLASSES & SYMBOLS (Memory-only, no side effects)
// ============================================================================
export {
   MessageChannel,
   MessagePort,
   BroadcastChannel,
   SHARE_ENV
};

// ============================================================================
// 4. DEFAULT EXPORT (For `import wt from 'node:worker_threads'`)
// ============================================================================
export default {
   // Blocked execution and state methods
   Worker,
   getEnvironmentData,
   setEnvironmentData,
   markAsUntransferable,
   moveMessagePortToContext,
   receiveMessageOnPort,

   // Safe thread context constants
   isMainThread,
   parentPort,
   threadId,
   workerData,

   // Safe messaging classes and symbols
   MessageChannel,
   MessagePort,
   BroadcastChannel,
   SHARE_ENV,
};
