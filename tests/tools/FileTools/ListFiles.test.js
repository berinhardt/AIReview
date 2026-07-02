import { jest } from '@jest/globals';
import { ListFiles } from '../../../tools/FileTools/ListFiles.js';
import fs from 'fs/promises';
import * as System from '../../../core/System.js';
import path from 'path';

jest.mock('fs/promises');
jest.mock('../../../core/System.js');

describe('ListFiles', () => {
  const ENV = { notesDir: '/notes', targetDir: '/target' };

  beforeEach(() => {
    jest.clearAllMocks();
    System.SanitizePath.mockImplementation((p) => Promise.resolve(path.join('/notes', p)));
    System.isIgnored.mockReturnValue(false);
  });

  it('should list files in a directory', async () => {
    const params = { path: 'test-dir', recursive: false };

    // Mock lstat for the directory itself
    fs.lstat.mockResolvedValue({ isDirectory: () => true });

    // Mock readdir to return some files
    fs.readdir.mockResolvedValue([
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true }
    ]);

    const result = await ListFiles(params, ENV);

    expect(result.result).toContain(path.normalize('test-dir/file1.txt'));
    expect(result.result).toContain(path.normalize('test-dir/subdir'));
  });

  it('should list files recursively', async () => {
    const params = { path: 'test-dir', recursive: true };

    // Mock lstat
    fs.lstat.mockImplementation((p) => {
      if (p.includes('file1.txt')) return Promise.resolve({ isDirectory: () => false });
      return Promise.resolve({ isDirectory: () => true });
    });

    // Mock readdir
    fs.readdir.mockImplementation((p) => {
      if (p.endsWith('test-dir')) {
        return Promise.resolve([
          { name: 'file1.txt', isDirectory: () => false },
          { name: 'subdir', isDirectory: () => true }
        ]);
      }
      if (p.endsWith('subdir')) {
        return Promise.resolve([
          { name: 'file2.txt', isDirectory: () => false }
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await ListFiles(params, ENV);

    expect(result.result).toContain(path.normalize('test-dir/file1.txt'));
    expect(result.result).toContain(path.normalize('test-dir/subdir/file2.txt'));
  });

  it('should skip files when SanitizePath fails', async () => {
    const params = { path: 'test-dir' };

    System.SanitizePath.mockRejectedValue(new Error('Invalid path'));

    const result = await ListFiles(params, ENV);

    expect(result).toEqual({ result: [] });
  });
});
