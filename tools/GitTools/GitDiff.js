import fs from 'fs';
import path from 'path';
import { runGitCommand, checkGitRepo, SanitizePath } from '../../core/System.js';

/**
 * @param {string} filename
 * @returns {string}
 */
export function GitDiff({ filename }, ENV) {
  const absolutePath = SanitizePath(filename, ENV.cwd);
  const dir = path.dirname(absolutePath);

  checkGitRepo(dir);

  if (!fs.existsSync(absolutePath)) {
    throw new Error('File not found');
  }

  return runGitCommand(['diff', filename], dir);
}

GitDiff.TOOLDEF = {
  type: 'function',
  name: 'GitDiff',
  description: 'Retrieve the raw diff of a specific file.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'The filename (relative to the project root).'
      }
    },
    required: ['filename']
  }
};
