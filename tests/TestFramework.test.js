import { exec } from "child_process";
import * as fs from "fs/promises";
import { vi, describe, it, expect } from "vitest";
describe("Test Framework Isolation", () => {
   it('should forbid writing to disk', async () => {
      await expect(async () => fs.writeFile("TEST.md", "didn't work")).rejects.toThrow();
   })
   it('should forbid executing custom commands', async () => {
      await expect(async () => exec("echo hola")).rejects.toThrow();
   })
   it('should avoid being cheated by importActual', async () => {
      vi.mock('fs/promises', async () => {
         const actual = await vi.importActual('fs/promises');
         const mock = {
            ...actual,
            stat: vi.fn(),
            lstat: vi.fn(),
            access: vi.fn(),
         };
         return {
            ...mock,
            default: mock,
         };
      });
      await expect(async () => fs.writeFile("TEST2.md", "didn't work")).rejects.toThrow();
   })
})
