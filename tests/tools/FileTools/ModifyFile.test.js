import { jest } from '@jest/globals';
import { ModifyFile } from '../../../tools/FileTools/ModifyFile.js';
import fs from 'fs/promises';
import * as System from '../../../core/System.js';

jest.mock('fs/promises');
jest.mock('../../../core/System.js');

describe('ModifyFile', () => {
  it('should modify a file successfully', async () => {
    const params = { filename: 'test.txt', search: 'old', replace: 'new' };
    const ENV = {};
    
    System.SanitizePath.mockResolvedValue('/abs/path/test.txt');
    System.acquireLock.mockResolvedValue(true);
    System.releaseLock.mockResolvedValue();
    fs.readFile.mockResolvedValue('this is old content');
    fs.writeFile.mockResolvedValue();

    const result = await ModifyFile(params, ENV);
    
    expect(result).toEqual({ result: 'Success' });
    expect(fs.writeFile).toHaveBeenCalledWith('/abs/path/test.txt', 'this is new content', 'utf8');
  });

  it('should return failure if search string not found', async () => {
    const params = { filename: 'test.txt', search: 'missing', replace: 'new' };
    const ENV = {};
    
    System.SanitizePath.mockResolvedValue('/abs/path/test.txt');
    System.acquireLock.mockResolvedValue(true);
    System.releaseLock.mockResolvedValue();
    fs.readFile.mockResolvedValue('this is old content');

    const result = await ModifyFile(params, ENV);
    
    expect(result).toEqual({ result: 'Failure', error: 'Search string not found on file' });
  });
});
