import { runGitCommand, checkGitRepo, SanitizePath } from '../../core/System.js';

/**
 * Gets a structured list of added, removed, and modified files in a directory.
 *
 * @param {Object} params - The parameters for getting the git status.
 * @param {string} params.dir - The directory path to check.
 * @param {string} [params.revision] - Optional revision (branch, commit, tag) to compare against.
 * @param {Object} ENV - The environment context.
 * @param {string} ENV.cwd - The current working directory.
 * @returns {Promise<{Added: string[], Removed: string[], Modified: string[]} | {error: string}>} A promise that resolves to an object containing the lists of files, or an error object if the revision is invalid.
 * @throws {Error} Throws an error if the git command fails.
 */
export async function GitStatus({ dir, revision }, ENV) {
  dir = await SanitizePath(dir, ENV.cwd);
  checkGitRepo(dir);

  let output;
  try {
    if (revision) {
      output = runGitCommand(['diff', '--name-status', revision], dir);
    } else {
      output = runGitCommand(['status', '--porcelain'], dir);
    }
  } catch (error) {
    if (revision && (error.message.includes('ambiguous argument') || error.message.includes('bad revision'))) {
      return { error: 'invalid rev' };
    }
    throw error;
  }

  const lines = output.trim().split('\n').filter(line => line.length > 0);

  const status = {
    Added: [],
    Removed: [],
    Modified: []
  };

  for (const line of lines) {
    if (revision) {
      // git diff --name-status <revision>
      // Format: [Status]\t[File]
      const parts = line.split('\t');
      const code = parts[0];
      const file = parts[1];

      if (code === 'A') status.Added.push(file);
      else if (code === 'D') status.Removed.push(file);
      else if (code === 'M') status.Modified.push(file);
    } else {
      // git status --porcelain
      // Format: [Code] [File]
      const code = line.substring(0, 2);
      const file = line.substring(3);

      if (code.includes('A')) status.Added.push(file);
      else if (code.includes('D')) status.Removed.push(file);
      else if (code.includes('M')) status.Modified.push(file);
      else if (code === '??') status.Added.push(file); // Untracked files
    }
  }

  return status;
}

GitStatus.TOOLDEF = {
  type: 'function',
  name: 'GitStatus',
  description: 'Get a structured list of added, removed, and modified files in a directory.',
  parameters: {
    type: 'object',
    properties: {
      dir: {
        type: 'string',
        description: 'The directory path to check.'
      },
      revision: {
        type: 'string',
        description: 'Optional revision (branch, commit, tag) to compare against.'
      }
    },
    required: ['dir']
  }
};
