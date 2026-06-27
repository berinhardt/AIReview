import fs from "fs/promises"
import { SanitizePath } from "../../core/System.js";

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
