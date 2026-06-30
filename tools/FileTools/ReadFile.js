import fs from "fs/promises"
import { SanitizePath } from "../../core/System.js";

/**
 * Reads a local file's content.
 *
 * @param {Object} params - The parameters for reading the file.
 * @param {string} params.filename - The relative path of the file (e.g., "src/index.html").
 * @param {Object} ENV - The environment context.
 * @param {string} ENV.cwd - The current working directory.
 * @returns {Promise<{content: string | null, error?: string}>} A promise that resolves to an object containing the file content or an error message.
 */
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
