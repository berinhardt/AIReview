import fs from "fs/promises"
import path from "path"
import { applyPatch } from "diff"
import { SanitizePath } from "../core/System.js";
export async function ReadFile({ filename }, ENV) {
   try {
      const targetPath = await SanitizePath(filename, ENV.cwd);
      const data = await fs.readFile(targetPath, "utf-8");
      return { content: data };
   } catch (error) {
      return { error: error.message };
   }
}
ReadFile.TOOLDEF = {
   type: 'function',
   name: 'FileTools.ReadFile',
   description: 'Read a local file\'s content.',
   parameters: {
      type: 'OBJECT',
      properties: {
         filename: { type: 'STRING', description: 'Relative path of the file (ej: "src/index.html")' },
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
      console.error(error);
      return { error: error.message };
   }
}
CreateFile.TOOLDEF = {
   type: 'function',
   name: 'FileTools.CreateFile',
   description: 'Create a new local file.',
   parameters: {
      type: 'OBJECT',
      properties: {
         filename: { type: 'STRING', description: 'Relative path of the file (ej: "src/index.html")' },
         content: { type: 'STRING', description: 'UTF8 File contents' }
      },
      required: ['filename', 'content']
   }
}
export async function ModifyFile({ filename, diffStr }, ENV) {
   try {
      console.log("modify", diffStr);
      const targetPath = await SanitizePath(filename, ENV.cwd);
      const original = await fs.readFile(targetPath, "utf8");
      const result = applyPatch(original, diffStr);
      if (result === false) throw new Error("Invalid Diff: source does not match hunks");
      await fs.writeFile(targetPath, result, "utf8");
      return { result: "Success" };
   } catch (error) {
      return { error: error.message };
   }
}
ModifyFile.TOOLDEF = {
   type: 'function',
   name: 'FileTools.ModifyFile',
   description: 'Modify a local file.',
   parameters: {
      type: 'OBJECT',
      properties: {
         filename: { type: 'STRING', description: 'Relative path of the file (ej: "src/index.html").' },
         diffStr: { type: 'STRING', description: 'Diff of the file changes in unidiff format.' }
      },
      required: ['filename', 'diffStr']
   }
}
