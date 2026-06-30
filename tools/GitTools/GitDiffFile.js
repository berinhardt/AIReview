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
export async function GitDiffFile({ filename, revision }, ENV) {
   const absolutePath = await SanitizePath(filename, ENV.cwd);
   const dir = path.dirname(absolutePath);
   const realname = path.basename(absolutePath);

   checkGitRepo(dir);

   if (!fs.existsSync(absolutePath)) {
      return { error: 'File not found' };
   }

   try {
      const result = runGitCommand(['diff', '-b', '--cached', '--find-renames', revision || "HEAD", '--', realname], dir);
      return { result };
   } catch (error) {
      if (revision && (error.message.includes('ambiguous argument') || error.message.includes('bad revision'))) {
         return { error: 'invalid revision' };
      } else {
         return { error: error.message };
      }
   }
}

GitDiffFile.TOOLDEF = {
   type: 'function',
   name: 'GitTools_GitDiffFile',
   description: 'Retrieve only the staged changes of a single specific file in diff format.',
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
