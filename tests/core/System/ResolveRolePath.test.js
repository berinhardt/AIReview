import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Dirname, ProjectRoot, resolveRolePath } from '../../../core/System.js';
import fs from 'fs/promises';
import path from 'path';
import * as os from 'os';

vi.mock('fs/promises');
function mockExists(files) {
   vi.mocked(fs.access).mockImplementation((p) => {
      if (files.includes(p)) return Promise.resolve();
      return Promise.reject(new Error('ENOENT'));
   });
}
describe('resolveRolePath', () => {
   const mockHome = os.homedir();
   const mockRoot = ProjectRoot();

   beforeEach(() => {
      vi.resetAllMocks();
   });
   it('should resolve project root', async () => {
      expect(path.resolve(Dirname(import.meta.url), "..", "..", "..")).toBe(mockRoot);
   });
   it('should resolve provided path directly if it exists', async () => {
      const providedPath = '/absolute/path/to/role.md';
      mockExists([
         '/absolute/path/to/role.md',
         path.join(mockHome, 'prompts/role.md'),
         path.join(mockRoot, 'prompts/role.md')
      ]);
      vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });

      const result = await resolveRolePath(providedPath);
      expect(result).toBe(providedPath);
   });

   it('should resolve provided path with .md extension if it exists', async () => {
      const providedPath = '/absolute/path/to/role';
      const expectedPath = '/absolute/path/to/role.md';
      mockExists([
         '/absolute/path/to/role.md',
         path.join(mockHome, 'prompts/role.md'),
         path.join(mockRoot, 'prompts/role.md')
      ]);
      vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });

      const result = await resolveRolePath(providedPath);
      expect(result).toBe(expectedPath);
   });

   it('should resolve to home directory if not found locally', async () => {
      const providedPath = 'role.md';
      const expectedPath = path.join(mockHome, 'prompts/role.md');
      mockExists([
         path.join(mockHome, 'prompts/role.md'),
         path.join(mockRoot, 'prompts/role.md')
      ]);
      vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });

      const result = await resolveRolePath(providedPath);
      expect(result).toBe(expectedPath);
   });
   it('should resolve to home directory if not found locally (add md)', async () => {
      const providedPath = 'role';
      const expectedPath = path.join(mockHome, 'prompts/role.md');
      mockExists([
         path.join(mockHome, 'prompts/role.md'),
         path.join(mockRoot, 'prompts/role.md')
      ]);
      vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });

      const result = await resolveRolePath(providedPath);
      expect(result).toBe(expectedPath);
   });

   it('should resolve to project root prompts directory if not found elsewhere', async () => {
      const providedPath = 'role.md';
      const expectedPath = path.join(mockRoot, 'prompts/role.md');
      mockExists([
         path.join(mockRoot, 'prompts/role.md')
      ]);
      vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });

      const result = await resolveRolePath(providedPath);
      expect(result).toBe(expectedPath);
   });
   it('should resolve to project root prompts directory if not found elsewhere (add md)', async () => {
      const providedPath = 'role';
      const expectedPath = path.join(mockRoot, 'prompts/role.md');
      mockExists([
         path.join(mockRoot, 'prompts/role.md')
      ]);
      vi.mocked(fs.stat).mockResolvedValue({ isFile: () => true });

      const result = await resolveRolePath(providedPath);
      expect(result).toBe(expectedPath);
   });

   it('should throw error if file not found anywhere', async () => {
      const providedPath = 'NonExistent';
      mockExists([]);

      await expect(resolveRolePath(providedPath)).rejects.toThrow('File not found: NonExistent');
   });
});
