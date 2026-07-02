import { describe, it, expect, vi } from 'vitest';
import { CreateFile } from '../../../tools/FileTools/CreateFile.js';
import fs from 'fs/promises';
import { SanitizePath } from '../../../core/System.js';

vi.mock('fs/promises');
vi.mock('../../../core/System.js');

describe('CreateFile', () => {
   it('should create a file successfully', async () => {
      const params = { filename: 'test.txt', content: 'hello' };
      const ENV = {};

      SanitizePath.mockResolvedValue('/abs/path/test.txt');
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const result = await CreateFile(params, ENV);

      expect(result).toEqual({ result: 'Success' });
      expect(SanitizePath).toHaveBeenCalledWith('test.txt', ENV);
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith('/abs/path/test.txt', 'hello', { encoding: 'utf8', flag: 'wx' });
   });

   it('should overwrite a file successfully when overrideIfExists is true', async () => {
      const params = { filename: 'test.txt', content: 'hello', overrideIfExists: true };
      const ENV = {};

      SanitizePath.mockResolvedValue('/abs/path/test.txt');
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const result = await CreateFile(params, ENV);

      expect(result).toEqual({ result: 'Success' });
      expect(fs.writeFile).toHaveBeenCalledWith('/abs/path/test.txt', 'hello', { encoding: 'utf8', flag: 'w' });
   });

   it('should fail to create a file when overrideIfExists is false (default)', async () => {
      const params = { filename: 'test.txt', content: 'hello', overrideIfExists: false };
      const ENV = {};

      SanitizePath.mockResolvedValue('/abs/path/test.txt');
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const result = await CreateFile(params, ENV);

      expect(result).toEqual({ result: 'Success' });
      expect(fs.writeFile).toHaveBeenCalledWith('/abs/path/test.txt', 'hello', { encoding: 'utf8', flag: 'wx' });
   });

   it('should return failure when SanitizePath fails', async () => {
      const params = { filename: 'test.txt', content: 'hello' };
      const ENV = {};

      SanitizePath.mockRejectedValue(new Error('Invalid path'));

      const result = await CreateFile(params, ENV);

      expect(result).toEqual({ result: 'Failure', error: 'Invalid path' });
   });

   it('should return failure when fs.writeFile fails', async () => {
      const params = { filename: 'test.txt', content: 'hello' };
      const ENV = {};

      SanitizePath.mockResolvedValue('/abs/path/test.txt');
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockRejectedValue(new Error('Permission denied'));

      const result = await CreateFile(params, ENV);

      expect(result).toEqual({ result: 'Failure', error: 'Permission denied' });
   });
});
