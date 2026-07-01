import fs from "fs/promises"
import path from "path"
import { SanitizePath } from "../../core/System.js";

/**
 * Creates a new local file.
 *
 * @param {Object} params - The parameters for creating the file.
 * @param {string} params.filename - The relative path of the file to create (e.g., "src/index.html").
 * @param {string} params.content - The UTF8 content to write to the file.
 * @param {Object} ENV - The environment context.
 * @returns {Promise<{result: string, error?: string}>} A promise that resolves to an object indicating success or failure.
 */
export async function CreateFile({ filename, content }, ENV) {
  try {
    const targetPath = await SanitizePath(filename, ENV);
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
