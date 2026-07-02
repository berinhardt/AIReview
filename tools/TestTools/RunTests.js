import { execFile } from "child_process";
import { promisify } from "util";
import { SanitizePath, runGitCommand, ValidateFile } from "../../core/System.js";
import path from "path";

const execFileAsync = promisify(execFile);
const TIMEOUT = 600000; // 10 minutes

/**
 * Runs tests in the Docker environment.
 *
 * @param {Object} params - The parameters for running tests.
 * @param {string} [params.testfile] - The optional test file path.
 * @param {Object} ENV - The environment context.
 * @returns {Promise<{result: string, error: string | null, success: boolean}>}
 */
export async function RunTests({ testfile }, ENV) {
   try {
      // 1. Safety Check: Check if package.json has been modified
      // We check for both staged and unstaged changes.
      const status = runGitCommand(['status', '--porcelain', 'package.json'], ENV.targetDir);
      if (status.trim() !== '') {
         return {
            result: "",
            error: "Human supervision required: package.json has been modified.",
            success: false
         };
      }

      let commandArgs = ['run', 'test:docker'];

      if (testfile) {
         // 2. Input Validation: Sanitize path
         const sanitizedPath = await SanitizePath(testfile, ENV);
         const relativePath = path.relative(ENV.targetDir, sanitizedPath);

         // Verify file exists
         const validation = await ValidateFile(sanitizedPath);
         if (!validation.valid) {
            return {
               result: "",
               error: `Invalid test file: ${validation.error}`,
               success: false
            };
         }

         // Use the sanitized path
         commandArgs.push('--', "npm", "test", relativePath);
      }

      // 3. Execution
      try {
         // Use execFile for security
         const cmd = await execFileAsync('npm', commandArgs, { timeout: TIMEOUT, cwd: ENV.targetDir });
         return {
            result: cmd,
            error: null,
            success: true
         };
      } catch (error) {
         return {
            result: error.stdout || "",
            error: error.stderr || error.message,
            success: false
         };
      }
   } catch (error) {
      return {
         result: "",
         error: error.message,
         success: false
      };
   }
}

RunTests.TOOLDEF = {
   type: 'function',
   name: 'RunTests',
   description: 'Execute tests in the Docker environment. Blocks if package.json is modified.',
   parameters: {
      type: 'object',
      properties: {
         testfile: { type: 'string', description: 'Optional path to a specific test file.' },
      },
      required: []
   }
};
