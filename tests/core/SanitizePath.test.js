import { SanitizePath } from '../../core/System.js';
import { lstat, stat } from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');

describe('SanitizePath', () => {
  const ENV = {
    notesDir: '/home/user/notes',
    targetDir: '/home/user/drive'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resolves paths starting with / using notesDir', async () => {
    stat.mockResolvedValue({ isDirectory: () => true });
    lstat.mockResolvedValue({ isSymbolicLink: () => false });

    const result = await SanitizePath('/my-note.txt', ENV);
    expect(result).toBe(path.normalize('/home/user/notes/my-note.txt'));
  });

  test('resolves paths starting with /drive using targetDir', async () => {
    stat.mockResolvedValue({ isDirectory: () => true });
    lstat.mockResolvedValue({ isSymbolicLink: () => false });

    const result = await SanitizePath('/drive/my-file.txt', ENV);
    expect(result).toBe(path.normalize('/home/user/drive/my-file.txt'));
  });

  test('throws Permission Denied if path points to a symlink', async () => {
    stat.mockResolvedValue({ isDirectory: () => true });
    lstat.mockResolvedValue({ isSymbolicLink: () => true });

    await expect(SanitizePath('/my-note.txt', ENV)).rejects.toThrow('Permission Denied');
  });

  test('throws Permission Denied if targetDir is accessed but not defined', async () => {
    const invalidENV = { notesDir: '/home/user/notes', targetDir: null };
    await expect(SanitizePath('/drive/file.txt', invalidENV)).rejects.toThrow('Permission Denied');
  });

  test('throws Permission Denied if targetDir is not a directory', async () => {
    stat.mockResolvedValue({ isDirectory: () => false });
    await expect(SanitizePath('/drive/file.txt', ENV)).rejects.toThrow('Permission Denied');
  });

  test('throws Permission Denied if path is outside targetDir or notesDir', async () => {
    // This is tricky because path.normalize/join might resolve it to something else.
    // The current implementation of SanitizePath does:
    // const resolvedPath = path.normalize(path.join(baseDir, relativePath));
    // And then checks:
    // if (!checkPath.startsWith(baseDir)) throw new Error("Permission Denied");
    
    // If I pass a path with ../, it should be caught.
    stat.mockResolvedValue({ isDirectory: () => true });
    lstat.mockResolvedValue({ isSymbolicLink: () => false });

    // This should be caught by the loop check
    await expect(SanitizePath('/../../etc/passwd', ENV)).rejects.toThrow('Permission Denied');
  });

  test('throws Permission Denied if path is a sibling directory (false positive check)', async () => {
    stat.mockResolvedValue({ isDirectory: () => true });
    lstat.mockResolvedValue({ isSymbolicLink: () => false });

    // /home/user/notes_backup is a sibling of /home/user/notes
    // The path /home/user/notes_backup/file.txt should be rejected
    await expect(SanitizePath('/../notes_backup/file.txt', ENV)).rejects.toThrow('Permission Denied');
  });

  test('handles filename inputs without a leading /', async () => {
    stat.mockResolvedValue({ isDirectory: () => true });
    lstat.mockResolvedValue({ isSymbolicLink: () => false });

    const result = await SanitizePath('my-note.txt', ENV);
    expect(result).toBe(path.normalize('/home/user/notes/my-note.txt'));
  });

  test('handles filename inputs that are just /', async () => {
    stat.mockResolvedValue({ isDirectory: () => true });
    lstat.mockResolvedValue({ isSymbolicLink: () => false });

    const result = await SanitizePath('/', ENV);
    expect(result).toBe(path.normalize('/home/user/notes/'));
  });

  test('handles scenarios where lstat throws an error (e.g., file not found)', async () => {
    stat.mockResolvedValue({ isDirectory: () => true });
    lstat.mockRejectedValue({ code: 'ENOENT' }); // File not found is okay

    const result = await SanitizePath('/new-file.txt', ENV);
    expect(result).toBe(path.normalize('/home/user/notes/new-file.txt'));
  });
});
