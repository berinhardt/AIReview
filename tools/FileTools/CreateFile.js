import fs from "fs/promises"
import path from "path"
import { SanitizePath } from "../../core/System.js";

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
