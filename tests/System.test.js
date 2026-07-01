import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SanitizePath } from '../core/System.js';
import * as fsPromises from 'fs/promises';
import path from 'path';

// Mock fs/promises
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

describe('SanitizePath', () => {
  const ENV = {
    notesDir: '/home/user/notes',
    targetDir: '/home/user/drive'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve paths starting with / correctly using notesDir', async () => {
    // Mock lstat to return a directory
    fsPromises.lstat.mockResolvedValue({
      isSymbolicLink: () => false,
      isDirectory: () => true
    });

    const result = await SanitizePath('/my-note.txt', ENV);
    expect(result).toBe(path.normalize('/home/user/notes/my-note.txt'));
  });

  it('should resolve paths starting with /drive/ correctly using targetDir', async () => {
    // Mock stat for targetDir check
    fsPromises.stat.mockResolvedValue({
      isDirectory: () => true
    });
    // Mock lstat for traversal check
    fsPromises.lstat.mockResolvedValue({
      isSymbolicLink: () => false
    });

    const result = await SanitizePath('/drive/my-file.txt', ENV);
    expect(result).toBe(path.normalize('/home/user/drive/my-file.txt'));
  });

  it('should throw Permission Denied if path points to a symlink', async () => {
    fsPromises.lstat.mockResolvedValue({
      isSymbolicLink: () => true
    });

    await expect(SanitizePath('/my-note.txt', ENV)).rejects.toThrow('Permission Denied');
  });

  it('should throw Permission Denied if targetDir is accessed but not defined', async () => {
    const invalidENV = { notesDir: '/home/user/notes', targetDir: '' };
    await expect(SanitizePath('/drive/file.txt', invalidENV)).rejects.toThrow('Permission Denied');
  });

  it('should throw Permission Denied if targetDir is not a directory', async () => {
    fsPromises.stat.mockResolvedValue({
      isDirectory: () => false
    });

    await expect(SanitizePath('/drive/file.txt', ENV)).rejects.toThrow('Permission Denied');
  });

  it('should throw Permission Denied if path is outside targetDir or notesDir', async () => {
    fsPromises.lstat.mockResolvedValue({
      isSymbolicLink: () => false
    });

    // Attempting to escape notesDir
    await expect(SanitizePath('/../../etc/passwd', ENV)).rejects.toThrow('Permission Denied');
  });

  it('should handle filename inputs without a leading /', async () => {
    fsPromises.lstat.mockResolvedValue({
      isSymbolicLink: () => false
    });
    const result = await SanitizePath('my-note.txt', ENV);
    expect(result).toBe(path.normalize('/home/user/notes/my-note.txt'));
  });

  it('should handle filename inputs that are just /', async () => {
    fsPromises.lstat.mockResolvedValue({
      isSymbolicLink: () => false
    });
    const result = await SanitizePath('/', ENV);
    expect(result).toBe(path.normalize('/home/user/notes'));
  });

  it('should handle scenarios where lstat throws an error (e.g., file not found)', async () => {
    // If lstat throws ENOENT, it should be fine (it's a new file)
    fsPromises.lstat.mockRejectedValue({ code: 'ENOENT' });

    const result = await SanitizePath('/new-file.txt', ENV);
    expect(result).toBe(path.normalize('/home/user/notes/new-file.txt'));
  });
});
