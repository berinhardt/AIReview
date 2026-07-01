import path from "path";
import { fileURLToPath } from "url";
import fsPromises, { access, constants, mkdir, readdir, realpath, stat } from "fs/promises";
import fs from 'fs';
import { execFileSync } from 'child_process';

export async function acquireLock(lockPath) {
  try {
    await mkdir(lockPath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function releaseLock(lockPath) {
  await fsPromises.rm(lockPath, { recursive: true });
}

export function Dirname(meta_url) {
  return path.dirname(fileURLToPath(meta_url));
}
export async function SanitizePath(filename, chroot) {
  await mkdir(chroot, { recursive: true });
  const cwd = await realpath(chroot);
  let targetPath = path.resolve(cwd, filename);

  // Check for hidden components in the target path
  const relativeTarget = path.relative(cwd, targetPath);
  const targetComponents = relativeTarget.split(path.sep);
  for (const component of targetComponents) {
    if (component.startsWith('.') && component !== '.' && component !== '..') {
      throw new Error("Permission Denied");
    }
  }

  let checkPath = targetPath;
  while (true) {
    try {
      const realPath = await realpath(checkPath);
      const relative = path.relative(cwd, realPath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error("Permission Denied");

      // Check for hidden components in the real path (to catch symlink tricks)
      const realComponents = relative.split(path.sep);
      for (const component of realComponents) {
        if (component.startsWith('.') && component !== '.' && component !== '..') {
          throw new Error("Permission Denied");
        }
      }

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

export async function ValidateFile(filePath) {
  try {
    await access(filePath, constants.R_OK);
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return { valid: false, error: "Path is not a file" };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
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
  if (!rval
    || typeof rval !== 'object'
    || typeof rval.request !== 'function'
    || typeof rval.abort !== 'function'
    || typeof rval.getName !== 'function') {
    throw new Error(`Model ${model} must be a class-based model instance with request(), abort(), and getName() methods.`);
  }
  return rval;
}

export function validateNonNegativeInteger(value, defaultValue) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    console.error(`Invalid non-negative integer provided: "${value}". Defaulting to ${defaultValue}.`);
    return defaultValue;
  }
  return parsed;
}
export function isIgnored(filePath, cwd) {
  try {
    console.log("II", filePath, cwd);
    execFileSync('git', ['check-ignore', '-q', filePath], { cwd });
    return true;
  } catch (error) {
    return false;
  }
}

export function runGitCommand(args, cwd = process.cwd()) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Git command not found');
    }
    if (error.code === 'EACCES') {
      throw new Error('Permission denied');
    }
    if (error.stderr) {
      const stderr = error.stderr.toString();
      if (stderr.includes('not a git repository')) {
        throw new Error('Not a git repository');
      }
      throw new Error(`Git command failed: ${stderr.trim()}`);
    }
    throw error;
  }
}

export function checkGitRepo(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error('File not found');
  }
  try {
    runGitCommand(['rev-parse', '--is-inside-work-tree'], dir);
  } catch (error) {
    if (error.message === 'Not a git repository') {
      throw error;
    }
    throw new Error('Not a git repository');
  }
}
