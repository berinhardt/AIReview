import { vi } from 'vitest';
import { constants } from 'node:fs';

const throwError = (method) => {
   throw new Error(`[Strict Isolation] fs.${method}() is forbidden in unit tests.`);
};

// ============================================================================
// 1. STREAMS
// ============================================================================
export const createReadStream = vi.fn(() => throwError('createReadStream'));
export const createWriteStream = vi.fn(() => throwError('createWriteStream'));

// ============================================================================
// 2. SYNCHRONOUS METHODS (Blocking reads and writes)
// ============================================================================
export const accessSync = vi.fn(() => throwError('accessSync'));
export const appendFileSync = vi.fn(() => throwError('appendFileSync'));
export const chmodSync = vi.fn(() => throwError('chmodSync'));
export const chownSync = vi.fn(() => throwError('chownSync'));
export const closeSync = vi.fn(() => throwError('closeSync'));
export const copyFileSync = vi.fn(() => throwError('copyFileSync'));
export const cpSync = vi.fn(() => throwError('cpSync'));
export const existsSync = vi.fn(() => throwError('existsSync'));
export const fchmodSync = vi.fn(() => throwError('fchmodSync'));
export const fchownSync = vi.fn(() => throwError('fchownSync'));
export const fdatasyncSync = vi.fn(() => throwError('fdatasyncSync'));
export const fstatSync = vi.fn(() => throwError('fstatSync'));
export const fsyncSync = vi.fn(() => throwError('fsyncSync'));
export const ftruncateSync = vi.fn(() => throwError('ftruncateSync'));
export const futimesSync = vi.fn(() => throwError('futimesSync'));
export const lchmodSync = vi.fn(() => throwError('lchmodSync'));
export const lchownSync = vi.fn(() => throwError('lchownSync'));
export const linkSync = vi.fn(() => throwError('linkSync'));
export const lstatSync = vi.fn(() => throwError('lstatSync'));
export const lutimesSync = vi.fn(() => throwError('lutimesSync'));
export const mkdirSync = vi.fn(() => throwError('mkdirSync'));
export const mkdtempSync = vi.fn(() => throwError('mkdtempSync'));
export const openSync = vi.fn(() => throwError('openSync'));
export const opendirSync = vi.fn(() => throwError('opendirSync'));
export const readSync = vi.fn(() => throwError('readSync'));
export const readdirSync = vi.fn(() => throwError('readdirSync'));
export const readFileSync = vi.fn(() => throwError('readFileSync'));
export const readlinkSync = vi.fn(() => throwError('readlinkSync'));
export const readvSync = vi.fn(() => throwError('readvSync'));
export const realpathSync = vi.fn(() => throwError('realpathSync'));
export const renameSync = vi.fn(() => throwError('renameSync'));
export const rmSync = vi.fn(() => throwError('rmSync'));
export const rmdirSync = vi.fn(() => throwError('rmdirSync'));
export const statSync = vi.fn(() => throwError('statSync'));
export const statfsSync = vi.fn(() => throwError('statfsSync'));
export const symlinkSync = vi.fn(() => throwError('symlinkSync'));
export const truncateSync = vi.fn(() => throwError('truncateSync'));
export const unlinkSync = vi.fn(() => throwError('unlinkSync'));
export const utimesSync = vi.fn(() => throwError('utimesSync'));
export const writeFileSync = vi.fn(() => throwError('writeFileSync'));
export const writeSync = vi.fn(() => throwError('writeSync'));
export const writevSync = vi.fn(() => throwError('writevSync'));

// ============================================================================
// 3. CALLBACK METHODS
// ============================================================================
export const access = vi.fn(() => throwError('access'));
export const appendFile = vi.fn(() => throwError('appendFile'));
export const chmod = vi.fn(() => throwError('chmod'));
export const chown = vi.fn(() => throwError('chown'));
export const close = vi.fn(() => throwError('close'));
export const copyFile = vi.fn(() => throwError('copyFile'));
export const cp = vi.fn(() => throwError('cp'));
export const exists = vi.fn(() => throwError('exists'));
export const fchmod = vi.fn(() => throwError('fchmod'));
export const fchown = vi.fn(() => throwError('fchown'));
export const fdatasync = vi.fn(() => throwError('fdatasync'));
export const fstat = vi.fn(() => throwError('fstat'));
export const fsync = vi.fn(() => throwError('fsync'));
export const ftruncate = vi.fn(() => throwError('ftruncate'));
export const futimes = vi.fn(() => throwError('futimes'));
export const lchmod = vi.fn(() => throwError('lchmod'));
export const lchown = vi.fn(() => throwError('lchown'));
export const link = vi.fn(() => throwError('link'));
export const lstat = vi.fn(() => throwError('lstat'));
export const lutimes = vi.fn(() => throwError('lutimes'));
export const mkdir = vi.fn(() => throwError('mkdir'));
export const mkdtemp = vi.fn(() => throwError('mkdtemp'));
export const open = vi.fn(() => throwError('open'));
export const opendir = vi.fn(() => throwError('opendir'));
export const read = vi.fn(() => throwError('read'));
export const readdir = vi.fn(() => throwError('readdir'));
export const readFile = vi.fn(() => throwError('readFile'));
export const readlink = vi.fn(() => throwError('readlink'));
export const readv = vi.fn(() => throwError('readv'));
export const realpath = vi.fn(() => throwError('realpath'));
export const rename = vi.fn(() => throwError('rename'));
export const rm = vi.fn(() => throwError('rm'));
export const rmdir = vi.fn(() => throwError('rmdir'));
export const stat = vi.fn(() => throwError('stat'));
export const statfs = vi.fn(() => throwError('statfs'));
export const symlink = vi.fn(() => throwError('symlink'));
export const truncate = vi.fn(() => throwError('truncate'));
export const unlink = vi.fn(() => throwError('unlink'));
export const unwatchFile = vi.fn(() => throwError('unwatchFile'));
export const utimes = vi.fn(() => throwError('utimes'));
export const watch = vi.fn(() => throwError('watch'));
export const watchFile = vi.fn(() => throwError('watchFile'));
export const write = vi.fn(() => throwError('write'));
export const writeFile = vi.fn(() => { throwError('writeFile') });
export const writev = vi.fn(() => throwError('writev'));

// ============================================================================
// 4. NESTED PROMISES OBJECT (For `fs.promises.readFile` usage)
// ============================================================================
export const promises = {
   access: vi.fn(() => throwError('promises.access')),
   appendFile: vi.fn(() => throwError('promises.appendFile')),
   chmod: vi.fn(() => throwError('promises.chmod')),
   chown: vi.fn(() => throwError('promises.chown')),
   copyFile: vi.fn(() => throwError('promises.copyFile')),
   cp: vi.fn(() => throwError('promises.cp')),
   lchmod: vi.fn(() => throwError('promises.lchmod')),
   lchown: vi.fn(() => throwError('promises.lchown')),
   link: vi.fn(() => throwError('promises.link')),
   lstat: vi.fn(() => throwError('promises.lstat')),
   lutimes: vi.fn(() => throwError('promises.lutimes')),
   mkdir: vi.fn(() => throwError('promises.mkdir')),
   mkdtemp: vi.fn(() => throwError('promises.mkdtemp')),
   open: vi.fn(() => throwError('promises.open')),
   opendir: vi.fn(() => throwError('promises.opendir')),
   readdir: vi.fn(() => throwError('promises.readdir')),
   readFile: vi.fn(() => throwError('promises.readFile')),
   readlink: vi.fn(() => throwError('promises.readlink')),
   realpath: vi.fn(() => throwError('promises.realpath')),
   rename: vi.fn(() => throwError('promises.rename')),
   rm: vi.fn(() => throwError('promises.rm')),
   rmdir: vi.fn(() => throwError('promises.rmdir')),
   stat: vi.fn(() => throwError('promises.stat')),
   statfs: vi.fn(() => throwError('promises.statfs')),
   symlink: vi.fn(() => throwError('promises.symlink')),
   truncate: vi.fn(() => throwError('promises.truncate')),
   unlink: vi.fn(() => throwError('promises.unlink')),
   utimes: vi.fn(() => throwError('promises.utimes')),
   watch: vi.fn(() => throwError('promises.watch')),
   writeFile: vi.fn(() => throwError('promises.writeFile')),
   constants,
};

// ============================================================================
// 5. EXPORTS
// ============================================================================
// Safe constants
export { constants };

// Default export combining everything for `import fs from 'node:fs'`
export default {
   // Streams
   createReadStream,
   createWriteStream,

   // Sync Methods
   accessSync, appendFileSync, chmodSync, chownSync, closeSync, copyFileSync, cpSync,
   existsSync, fchmodSync, fchownSync, fdatasyncSync, fstatSync, fsyncSync,
   ftruncateSync, futimesSync, lchmodSync, lchownSync, linkSync, lstatSync,
   lutimesSync, mkdirSync, mkdtempSync, openSync, opendirSync, readSync, readdirSync,
   readFileSync, readlinkSync, readvSync, realpathSync, renameSync, rmSync,
   rmdirSync, statSync, statfsSync, symlinkSync, truncateSync, unlinkSync,
   utimesSync, writeFileSync, writeSync, writevSync,

   // Callback Methods
   access, appendFile, chmod, chown, close, copyFile, cp, exists, fchmod, fchown,
   fdatasync, fstat, fsync, ftruncate, futimes, lchmod, lchown, link, lstat, lutimes,
   mkdir, mkdtemp, open, opendir, read, readdir, readFile, readlink, readv, realpath,
   rename, rm, rmdir, stat, statfs, symlink, truncate, unlink, unwatchFile, utimes,
   watch, watchFile, write, writeFile, writev,

   // Nested Promises Object
   promises,

   // Constants
   constants,
};
