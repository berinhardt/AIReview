import path from "path";
import { fileURLToPath } from "url";
import fs, { access, constants, mkdir, readdir, realpath } from "fs/promises";

export async function acquireLock(lockPath) {
  try {
    await mkdir(lockPath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function releaseLock(lockPath) {
  await fs.rm(lockPath, { recursive: true });
}

export function Dirname(meta_url) {
   return path.dirname(fileURLToPath(meta_url));
}
export async function SanitizePath(filename, chroot) {
   await mkdir(chroot, { recursive: true });
   const cwd = await realpath(chroot);
   let targetPath = path.resolve(cwd, filename);
   let checkPath = targetPath;
   while (true) {
      try {
         const realPath = await realpath(checkPath);
         const relative = path.relative(cwd, realPath);
         if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error("Permission Denied");
         return targetPath;
      } catch (error) {
         if (error.code === 'ENOENT') {
            const parent = path.dirname(checkPath);
            if (parent === checkPath) throw new Error("Permission Denied");
            checkPath = parent;
         } else {
            throw new Error("Permission Denied");
         }
      }
   }
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

export function isTransientError(error) {
    return true;
}

export function validateNonNegativeInteger(value, defaultValue) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
        console.error(`Invalid non-negative integer provided: "${value}". Defaulting to ${defaultValue}.`);
        return defaultValue;
    }
    return parsed;
}
