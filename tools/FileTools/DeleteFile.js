import fs from "fs/promises"
import { SanitizePath } from "../../core/System.js";

/**
 * Deletes a file or an empty directory.
 *
 * @param {Object} params - The parameters for deleting the file or directory.
 * @param {string} params.path - The relative path of the file or directory to delete.
 * @param {Object} ENV - The environment context.
 * @param {string} ENV.cwd - The current working directory.
 * @returns {Promise<{result: string, error?: string}>} A promise that resolves to an object indicating success or failure.
 */
export async function DeleteFile({ path: targetPath }, ENV) {
   try {
      const sanitizedPath = await SanitizePath(targetPath, ENV.cwd);
      const stats = await fs.stat(sanitizedPath);
      
      if (stats.isFile()) {
          await fs.unlink(sanitizedPath);
      } else if (stats.isDirectory()) {
          await fs.rmdir(sanitizedPath); // Will fail if not empty, which is desired
      } else {
          throw new Error("Target is neither a file nor a directory");
      }
      
      return { result: "Success" };
   } catch (error) {
      return { result: "Failure", error: error.message };
   }
}
DeleteFile.TOOLDEF = {
   type: 'function',
   name: 'FileTools_DeleteFile',
   description: 'Delete a file or an empty directory.',
   parameters: {
      type: 'object',
      properties: {
         path: { type: 'string', description: 'Relative path of the file or directory to delete' }
      },
      required: ['path']
   }
}
