import path from "path";
import { fileURLToPath } from "url";
import { access, constants, readdir } from "fs/promises";
export function Dirname(meta_url) {
  return path.dirname(fileURLToPath(meta_url));
}
export async function LoadLLMModel(model) {
   const __dirname = path.join(Dirname(import.meta.url), "..");

   const AVAILABLE_MODELS = await readdir(path.join(__dirname, "models"));
   const [moduleName, moduleMethod] = model.split(/\./, 2);
   if (AVAILABLE_MODELS.indexOf(`${moduleName}.js`) == -1) {
      throw new Error(`Unknown Model Family ${model}`);
   }
   const modulePath = path.join(__dirname, "models", `${moduleName}.js`);
   await access(modulePath, constants.F_OK);
   const module = await import(`file://${modulePath}`);
   const rval = module[moduleMethod];
   if (typeof rval !== 'function') {
      throw new Error(`Unknown Model ${model}`);
   }
  return rval;
}
