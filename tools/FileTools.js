import fs from "fs/promises"
import path from "path"
import { SanitizePath, acquireLock, releaseLock } from "../core/System.js";

export async function ReadFile({ filename }, ENV) {
  try {
    const targetPath = await SanitizePath(filename, ENV.cwd);
    const data = await fs.readFile(targetPath, "utf-8");
    return { content: data };
  } catch (error) {
    return { content: null, error: error.message };
  }
}
ReadFile.TOOLDEF = {
  type: 'function',
  name: 'FileTools_ReadFile',
  description: 'Read a local file\'s content.',
  parameters: {
    type: 'object',
    properties: {
      filename: { type: 'string', description: 'Relative path of the file (ej: "src/index.html")' },
    },
    required: ['filename']
  }
};
export async function CreateFile({ filename, content }, ENV) {
  try {
    const targetPath = await SanitizePath(filename, ENV.cwd);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content, { encoding: 'utf8', flag: "wx" });
    return { result: "Success" };
  } catch (error) {
    return { result: "Failure", error: error.message };
  }
}
CreateFile.TOOLDEF = {
  type: 'function',
  name: 'FileTools_CreateFile',
  description: 'Create a new local file.',
  parameters: {
    type: 'object',
    properties: {
      filename: { type: 'string', description: 'Relative path of the file (ej: "src/index.html")' },
      content: { type: 'string', description: 'UTF8 File contents' }
    },
    required: ['filename', 'content']
  }
}
export async function SearchReplaceFile({ filename, search, replace }, ENV) {
  const targetPath = await SanitizePath(filename, ENV.cwd);
  const lockPath = targetPath + ".lock";

  // Simple retry mechanism for locking
  let locked = false;
  for (let i = 0; i < 10; i++) {
    if (await acquireLock(lockPath)) {
      locked = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
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
SearchReplaceFile.TOOLDEF = {
  type: 'function',
  name: 'FileTools_SearchReplaceFile',
  description: 'Perform a search and replace on a local file.',
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
