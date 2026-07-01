import fs from "fs/promises"
import { SanitizePath, acquireLock, releaseLock } from "../../core/System.js";

/**
 * Modifies a local file by performing a unique search & replace operation.
 *
 * @param {Object} params - The parameters for modifying the file.
 * @param {string} params.filename - The relative path of the file (e.g., "src/index.html").
 * @param {string} params.search - The original code to search for.
 * @param {string} params.replace - The replacement code.
 * @param {Object} ENV - The environment context.
 * @returns {Promise<{result: string, error?: string}>} A promise that resolves to an object indicating success or failure.
 */
export async function ModifyFile({ filename, search, replace }, ENV) {
  const targetPath = await SanitizePath(filename, ENV);
  const lockPath = targetPath + ".lock";

  // Improved retry mechanism with exponential backoff
  let locked = false;
  let delay = 50; // Start with 50ms
  const maxDelay = 1000; // Max 1s
  const maxRetries = 20; // Increased retries

  for (let i = 0; i < maxRetries; i++) {
    if (await acquireLock(lockPath)) {
      locked = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, maxDelay); // Exponential backoff
  }

  if (!locked) {
    return { result: "Failure", error: "Could not acquire file lock" };
  }

  try {
    const original = await fs.readFile(targetPath, "utf8");
    const normalizedOriginal = original.replace(/\r?\n\r?/g, '\n');
    const normalizedSearch = search.replace(/\r?\n\r?/g, '\n');
    const normalizedReplace = replace.replace(/\r?\n\r?/g, '\n');
    const startIndex = normalizedOriginal.indexOf(normalizedSearch);
    if (startIndex === -1) throw new Error("Search string not found on file");
    if (startIndex !== normalizedOriginal.lastIndexOf(normalizedSearch)) throw new Error("Multiple matches, increase context and try again");
    const result = normalizedOriginal.substring(0, startIndex)
      + normalizedReplace
      + normalizedOriginal.substring(startIndex + normalizedSearch.length);
    await fs.writeFile(targetPath, result, "utf8");
    return { result: "Success" };
  } catch (error) {
    return { result: "Failure", error: error.message };
  } finally {
    await releaseLock(lockPath);
  }
}
ModifyFile.TOOLDEF = {
  type: 'function',
  name: 'FileTools_ModifyFile',
  description: 'Modify a local file by performing a unique search & replace operation.',
  parameters: {
    type: 'object',
    properties: {
      filename: { type: 'string', description: 'Relative path of the file (ej: "src/index.html").' },
      search: { type: 'string', description: 'Original code' },
      replace: { type: 'string', description: 'Replacement code' }
    },
    required: ['filename', 'search', 'replace']
  }
}
