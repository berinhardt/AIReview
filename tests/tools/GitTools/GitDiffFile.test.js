import { describe, it, expect, vi } from 'vitest';
import { GitDiffFile } from '../../../tools/GitTools/GitDiffFile.js';
import fs from 'fs';
import * as System from '../../../core/System.js';

vi.mock('fs');
vi.mock('../../../core/System.js');

describe('GitDiffFile', () => {
  it('should return diff successfully', async () => {
    const params = { filename: 'test.txt' };
    const ENV = {};
    
    System.SanitizePath.mockResolvedValue('/abs/path/test.txt');
    System.checkGitRepo.mockReturnValue(true);
    fs.existsSync.mockReturnValue(true);
    System.runGitCommand.mockReturnValue('diff content');

    const result = await GitDiffFile(params, ENV);
    
    expect(result).toEqual({ result: 'diff content' });
  });

  it('should return error if file not found', async () => {
    const params = { filename: 'test.txt' };
    const ENV = {};
    
    System.SanitizePath.mockResolvedValue('/abs/path/test.txt');
    fs.existsSync.mockReturnValue(false);

    const result = await GitDiffFile(params, ENV);
    
    expect(result).toEqual({ error: 'File not found' });
  });
});
