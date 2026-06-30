import fs from 'fs';
import path from 'path';
import { runGitCommand, checkGitRepo, SanitizePath } from '../../core/System.js';

/**
 * Retrieves the raw diff of a specific file.
 *
 * @param {Object} params - The parameters for getting the git diff.
 * @param {string} params.filename - The filename (relative to the project root).
 * @param {string} [params.revision] - Optional revision (branch, commit, tag) to compare against.
 * @param {Object} ENV - The environment context.
 * @param {string} ENV.cwd - The current working directory.
 * @returns {Promise<{result:string}, {error: string}>} A promise that resolves to the diff string, or an error object if the revision is invalid.
 * @throws {Error} Throws an error if the file is not found or if the git command fails.
 */
export async function GitDiff({ filename, revision }, ENV) {
   const absolutePath = await SanitizePath(filename, ENV.cwd);
   const dir = path.dirname(absolutePath);

   checkGitRepo(dir);

   if (!fs.existsSync(absolutePath)) {
      throw new Error('File not found');
   }

   try {
      if (revision) {
         return { result: runGitCommand(['diff', revision, '--', filename], dir) };
      } else {
         return { result: runGitCommand(['diff', '--', filename], dir) };
      }
   } catch (error) {
      if (revision && (error.message.includes('ambiguous argument') || error.message.includes('bad revision'))) {
         return { error: 'invalid rev' };
      }
      throw error;
   }
}

GitDiff.TOOLDEF = {
   type: 'function',
   name: 'GitTools_GitDiff',
   description: 'Retrieve the raw diff of a specific file.',
   parameters: {
      type: 'object',
      properties: {
         filename: {
            type: 'string',
            description: 'The filename (relative to the project root).'
         },
         revision: {
            type: 'string',
            description: 'Optional revision (branch, commit, tag) to compare against.'
         }
      },
      required: ['filename']
   }
};
