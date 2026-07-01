import { describe, it, expect, vi } from 'vitest';
import { DeleteFile } from '../../../tools/FileTools/DeleteFile.js';
import fs from 'fs/promises';
import { SanitizePath } from '../../../core/System.js';

vi.mock('fs/promises');
vi.mock('../../../core/System.js');

describe('DeleteFile', () => {
  it('should delete a file successfully', async () => {
    const params = { path: 'test.txt' };
    const ENV = {};
    
    SanitizePath.mockResolvedValue('/abs/path/test.txt');
    fs.stat.mockResolvedValue({ isFile: () => true, isDirectory: () => false });
    fs.unlink.mockResolvedValue();

    const result = await DeleteFile(params, ENV);
    
    expect(result).toEqual({ result: 'Success' });
    expect(fs.unlink).toHaveBeenCalledWith('/abs/path/test.txt');
  });

  it('should delete a directory successfully', async () => {
    const params = { path: 'test-dir' };
    const ENV = {};
    
    SanitizePath.mockResolvedValue('/abs/path/test-dir');
    fs.stat.mockResolvedValue({ isFile: () => false, isDirectory: () => true });
    fs.rmdir.mockResolvedValue();

    const result = await DeleteFile(params, ENV);
    
    expect(result).toEqual({ result: 'Success' });
    expect(fs.rmdir).toHaveBeenCalledWith('/abs/path/test-dir');
  });

  it('should return failure if target is neither file nor directory', async () => {
    const params = { path: 'test' };
    const ENV = {};
    
    SanitizePath.mockResolvedValue('/abs/path/test');
    fs.stat.mockResolvedValue({ isFile: () => false, isDirectory: () => false });

    const result = await DeleteFile(params, ENV);
    
    expect(result).toEqual({ result: 'Failure', error: 'Target is neither a file nor a directory' });
  });

  it('should return failure when SanitizePath fails', async () => {
    const params = { path: 'test' };
    const ENV = {};
    
    SanitizePath.mockRejectedValue(new Error('Invalid path'));

    const result = await DeleteFile(params, ENV);
    
    expect(result).toEqual({ result: 'Failure', error: 'Invalid path' });
  });
});
