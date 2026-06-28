import fs from "fs/promises"
import { SanitizePath } from "../../core/System.js";

const MAX_FILES_RETURNED = 1024;

export async function ListFiles({ path: targetPath }, ENV) {
   try {
      const sanitizedPath = await SanitizePath(targetPath, ENV.cwd);
      const files = await fs.readdir(sanitizedPath);
      
      // Filter out hidden files (starting with .)
      const filteredFiles = files.filter(file => !file.startsWith('.'));
      
      let result = filteredFiles;
      let warning = null;
      
      if (filteredFiles.length > MAX_FILES_RETURNED) {
          result = filteredFiles.slice(0, MAX_FILES_RETURNED);
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
         path: { type: 'string', description: 'Relative path of the directory to list' }
      },
      required: ['path']
   }
}
