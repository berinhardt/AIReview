import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as System from '../../../core/System.js';
import { execFile } from 'child_process';

vi.mock('../../../core/System.js', () => ({
   SanitizePath: vi.fn(),
   runGitCommand: vi.fn(),
   ValidateFile: vi.fn(),
}));

vi.mock('child_process', () => ({
   execFile: vi.fn(),
}));


import { RunTestsTool } from '../../../tools/TestTools/RunTestsTool.js';

describe('RunTestsTool', () => {
   const ENV = { targetDir: '/mock/dir' };

   beforeEach(() => {
      vi.clearAllMocks();
   });

   it('should block execution if package.json is modified', async () => {
      System.runGitCommand.mockReturnValue('M package.json');

      const result = await RunTestsTool({}, ENV);

      expect(result.success).toBe(false);
      expect(result.error).toContain('package.json has been modified');
      expect(execFile).not.toHaveBeenCalled();
   });

   it('should run tests successfully', async () => {
      System.runGitCommand.mockReturnValue('');
      execFile.mockImplementation((cmd, args, options, callback) => {
         callback(null, 'Test passed', '');
      });

      const result = await RunTestsTool({}, ENV);

      expect(result.success).toBe(true);
      expect(result.result).toBe('Test passed');
      expect(execFile).toHaveBeenCalledWith('npm', ['run', 'test:docker'], expect.any(Object), expect.any(Function));
   });

   it('should run specific test file successfully', async () => {
      System.runGitCommand.mockReturnValue('');
      System.SanitizePath.mockResolvedValue('/mock/dir/test.js');
      System.ValidateFile.mockResolvedValue({ valid: true });
      execFile.mockImplementation((cmd, args, options, callback) => {
         callback(null, 'Test passed', '');
      });

      const result = await RunTestsTool({ testfile: 'test.js' }, ENV);

      expect(result.success).toBe(true);
      expect(execFile).toHaveBeenCalledWith('npm', ['run', 'test:docker', '--', '/mock/dir/test.js'], expect.any(Object), expect.any(Function));
   });

   it('should handle test failure', async () => {
      System.runGitCommand.mockReturnValue('');
      execFile.mockImplementation((cmd, args, options, callback) => {
         const error = new Error('Test failed');
         error.stdout = '';
         error.stderr = 'Error';
         callback(error, '', 'Error');
      });

      const result = await RunTestsTool({}, ENV);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error');
   });
});
