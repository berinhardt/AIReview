import fs from "fs/promises"
import { SanitizePath } from "../../core/System.js";

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
