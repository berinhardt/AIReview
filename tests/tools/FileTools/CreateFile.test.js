import { jest } from '@jest/globals';
import { CreateFile } from '../../../tools/FileTools/CreateFile.js';
import fs from 'fs/promises';
import * as System from '../../../core/System.js';

jest.mock('fs/promises');
jest.mock('../../../core/System.js');

describe('CreateFile', () => {
   it('should create a file successfully', async () => {
      const params = { filename: 'test.txt', content: 'hello' };
      const ENV = {};

      System.SanitizePath.mockResolvedValue('/abs/path/test.txt');
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const result = await CreateFile(params, ENV);

      expect(result).toEqual({ result: 'Success' });
      expect(System.SanitizePath).toHaveBeenCalledWith('test.txt', ENV);
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith('/abs/path/test.txt', 'hello', { encoding: 'utf8', flag: 'wx' });
   });

   it('should return failure when SanitizePath fails', async () => {
      const params = { filename: 'test.txt', content: 'hello' };
      const ENV = {};

      System.SanitizePath.mockRejectedValue(new Error('Invalid path'));

      const result = await CreateFile(params, ENV);

      expect(result).toEqual({ result: 'Failure', error: 'Invalid path' });
   });

   it('should return failure when fs.writeFile fails', async () => {
      const params = { filename: 'test.txt', content: 'hello' };
      const ENV = {};

      System.SanitizePath.mockResolvedValue('/abs/path/test.txt');
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockRejectedValue(new Error('Permission denied'));

      const result = await CreateFile(params, ENV);

      expect(result).toEqual({ result: 'Failure', error: 'Permission denied' });
   });
});
