import { runGitCommand, checkGitRepo } from '../../core/System.js';

/**
 * @param {string} dir
 * @returns {{Added: string[], Removed: string[], Modified: string[]}}
 */
export function GitStatus(dir) {
  checkGitRepo(dir);

  const output = runGitCommand(['status', '--porcelain'], dir);
  const lines = output.trim().split('\n').filter(line => line.length > 0);

  const status = {
    Added: [],
    Removed: [],
    Modified: []
  };

  for (const line of lines) {
    const code = line.substring(0, 2);
    const file = line.substring(3);

    if (code.includes('A')) status.Added.push(file);
    else if (code.includes('D')) status.Removed.push(file);
    else if (code.includes('M')) status.Modified.push(file);
    else if (code === '??') status.Added.push(file); // Untracked files
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
      }
    },
    required: ['dir']
  }
};
