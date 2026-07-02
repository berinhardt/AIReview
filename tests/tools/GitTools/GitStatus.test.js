import { jest } from '@jest/globals';
import { GitStatus } from '../../../tools/GitTools/GitStatus.js';
import * as System from '../../../core/System.js';

jest.mock('../../../core/System.js');

describe('GitStatus', () => {
  it('should return status successfully', async () => {
    const params = { dir: 'test-dir' };
    const ENV = {};
    
    System.SanitizePath.mockResolvedValue('/abs/path/test-dir');
    System.checkGitRepo.mockReturnValue(true);
    System.runGitCommand.mockReturnValue('A\tfile1.txt\nD\tfile2.txt\nM\tfile3.txt');

    const result = await GitStatus(params, ENV);
    
    expect(result).toEqual({
      Added: ['file1.txt'],
      Removed: ['file2.txt'],
      Modified: ['file3.txt']
    });
  });

  it('should return error for invalid revision', async () => {
    const params = { dir: 'test-dir', revision: 'invalid' };
    const ENV = {};
    
    System.SanitizePath.mockResolvedValue('/abs/path/test-dir');
    System.checkGitRepo.mockReturnValue(true);
    System.runGitCommand.mockImplementation(() => {
      throw new Error('bad revision');
    });

    const result = await GitStatus(params, ENV);
    
    expect(result).toEqual({ error: 'invalid revision' });
  });
});
