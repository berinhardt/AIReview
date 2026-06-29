import fs from 'fs';
import path from 'path';
import { runGitCommand, checkGitRepo, SanitizePath } from '../../core/System.js';

/**
 * @param {string} filename
 * @param {string} [revision]
 * @returns {string | {error: string}} Returns the diff string, or an error object {"error": "invalid rev"} if the revision is invalid.
 */
export function GitDiff({ filename, revision }, ENV) {
  const absolutePath = SanitizePath(filename, ENV.cwd);
  const dir = path.dirname(absolutePath);

  checkGitRepo(dir);

  if (!fs.existsSync(absolutePath)) {
    throw new Error('File not found');
  }

  try {
    if (revision) {
      return runGitCommand(['diff', revision, '--', filename], dir);
    } else {
      return runGitCommand(['diff', filename], dir);
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
  name: 'GitDiff',
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
