import fs from "fs/promises"
import path from "path"
import { SanitizePath } from "../../core/System.js";

const MAX_FILES_RETURNED = 1024;

export async function ListFiles({ path: targetPath, recursive = false }, ENV) {
  try {
    const sanitizedPath = await SanitizePath(targetPath, ENV.cwd);

    const files = [];

    async function traverse(currentPath, relativePath) {
      if (files.length >= MAX_FILES_RETURNED) return;

      let entries;
      try {
        entries = await fs.readdir(currentPath, { withFileTypes: true });
      } catch (error) {
        // Skip inaccessible directories
        return;
      }

      for (const entry of entries) {
        if (files.length >= MAX_FILES_RETURNED) break;
        const hidden = entry.name.startsWith('.');

        const fullPath = path.join(currentPath, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory() && !hidden) {
          if (recursive) {
            await traverse(fullPath, relPath);
          }
        } else if (!entry.isSymbolicLink()) {
          files.push(relPath);
        }
      }
    }

    if (recursive) {
      await traverse(sanitizedPath, "");
    } else {
      const entries = await fs.readdir(sanitizedPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() || entry.isDirectory()) {
          files.push(entry.name);
        }
      }
    }

    let result = files;
    let warning = null;

    if (files.length > MAX_FILES_RETURNED) {
      result = files.slice(0, MAX_FILES_RETURNED);
      warning = `List truncated. Showing first ${MAX_FILES_RETURNED} items.`;
    }

    return { result, warning };
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
