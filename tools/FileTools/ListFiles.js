import fs from "fs/promises"
import path from "path"
import { isIgnored, SanitizePath } from "../../core/System.js";

const MAX_FILES_RETURNED = 1024;

/**
 * Lists contents of a directory.
 *
 * @param {Object} params - The parameters for listing files.
 * @param {string} params.path - The relative path of the directory to list.
 * @param {boolean} [params.recursive=false] - Whether to list files recursively.
 * @param {Object} ENV - The environment context.
 * @returns {Promise<{result: string[] | string, warning?: string, error?: string}>} A promise that resolves to an object containing the list of files, a warning if truncated, or an error message.
 */
export async function ListFiles(params, ENV) {
  try {
    const files = [];
    let warning = null;
    async function traverse(currentPath) {
      if (files.length >= MAX_FILES_RETURNED) {
        warning = "Too many files"
      };

      try {
        const safePath = await SanitizePath(currentPath, ENV);
        const basename = path.basename(safePath);
        const relative = path.relative(safePath, ENV.notesDir);
        const ignored = basename != ".git" && (relative.startsWith("..") || path.isAbsolute(relative)) && isIgnored(safePath);
        if (!ignored) {
          const stats = await fs.lstat(safePath);
          if (!stats.isDirectory() || !params.recursive || params.path !== currentPath)
            files.push(currentPath);
          if (stats.isDirectory() && basename != ".git") {
            const entries = await fs.readdir(safePath, { withFileTypes: true });
            for (const entry of entries) {
              if (files.length >= MAX_FILES_RETURNED) break;
              const relativePath = path.join(currentPath, entry.name);

              if (params.recursive) {
                await traverse(relativePath);
              } else {
                files.push(relativePath);
              }
            }
          }
          if (safePath == ENV.notesDir && ENV.targetDir) {
            if (params.recursive) await traverse(path.join("drive"));
            else
              files.push(path.join("drive"))
          }
        }
      } catch (error) {
        console.error(error);
        return;
      }
    }

    await traverse(params.path);

    const result = {
      result: files,
    };
    if (warning) result.warning;
    return result;
  } catch (error) {
    return { result: "Failure", error: error.message };
  }
}
ListFiles.TOOLDEF = {
  type: 'function',
  name: 'FileTools_ListFiles',
  description: 'List contents of a directory.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Relative path of the directory to list' },
      recursive: { type: 'boolean', description: 'Whether to list files recursively', default: false }
    },
    required: ['path']
  }
}
