import path from "path";
import { fileURLToPath } from "url";
import fsPromises, { access, constants, mkdir, readdir, realpath, stat, lstat } from "fs/promises";
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
export async function SanitizePath(filename, ENV) {
  const { notesDir, targetDir } = ENV;
  if (filename[0] != "/") filename = path.join("/", filename);

  let baseDir = path.normalize(targetDir);
  let relativePath = path.relative(path.join("/", "drive"), filename);

  if (path.isAbsolute(relativePath) || relativePath.startsWith("..")) {
    baseDir = path.normalize(notesDir);
    relativePath = path.relative("/", filename);
  }

  if (baseDir === targetDir && !targetDir)
    throw new Error("Permission Denied");

  if (baseDir === targetDir) {
    try {
      const stats = await stat(targetDir);
      if (!stats.isDirectory())
        throw new Error("Permission Denied");
    } catch (e) {
      throw new Error("Permission Denied");
    }
  }

  // Resolve path
  const resolvedPath = path.normalize(path.join(baseDir, relativePath));

  // Check for symlinks in the path
  let checkPath = resolvedPath;
  while (true) {
    try {
      const stats = await lstat(checkPath);
      if (stats.isSymbolicLink()) throw new Error("Permission Denied");
    } catch (e) {
      if (e.code !== "ENOENT")
        throw new Error("Permission Denied");
    }

    if (checkPath.endsWith(path.sep)) checkPath = checkPath.substring(0, checkPath.length - 1);
    if (checkPath === baseDir) break;
    checkPath = path.dirname(checkPath);
    const relative = path.relative(baseDir, checkPath);
    if (relative.startsWith('..') || path.isAbsolute(relative))
      throw new Error("Permission Denied");
  }

  return resolvedPath;
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
export function isIgnored(filePath) {
  try {
    execFileSync('git', ['check-ignore', '-q', path.basename(filePath)], { cwd: path.dirname(filePath) });
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
