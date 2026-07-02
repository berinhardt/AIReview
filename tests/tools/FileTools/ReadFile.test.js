import { jest } from '@jest/globals';
import { ReadFile } from '../../../tools/FileTools/ReadFile.js';
import fs from 'fs/promises';
import * as System from '../../../core/System.js';

jest.mock('fs/promises');
jest.mock('../../../core/System.js');

describe('ReadFile', () => {
  it('should read a file successfully', async () => {
    const params = { filename: 'test.txt' };
    const ENV = {};
    
    System.SanitizePath.mockResolvedValue('/abs/path/test.txt');
    fs.readFile.mockResolvedValue('file content');

    const result = await ReadFile(params, ENV);
    
    expect(result).toEqual({ content: 'file content' });
  });

  it('should return error when file not found', async () => {
    const params = { filename: 'test.txt' };
    const ENV = {};
    
    System.SanitizePath.mockResolvedValue('/abs/path/test.txt');
    fs.readFile.mockRejectedValue(new Error('File not found'));

    const result = await ReadFile(params, ENV);
    
    expect(result).toEqual({ content: null, error: 'File not found' });
  });
});
