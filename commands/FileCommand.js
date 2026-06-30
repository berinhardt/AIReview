import { readFile, stat } from "fs/promises";
import { Command } from "./Command.js";

import { readFile, stat } from "fs/promises";
import { Command } from "./Command.js";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

/**
 * Command to load a file into the prompt buffer.
 * @extends Command
 */
export class FileCommand extends Command {
    /**
     * @property {CommandMeta} META
     */
    constructor() {
        super("FILE");
        this.META = {
            name: "FILE",
            description: "Load a file into the prompt buffer",
            arguments: [
                { type: "string", name: "filename", description: "The path to the file" }
            ]
        };
    }

    /**
     * Executes the file loading command.
     * @description Reads a file from the filesystem and adds its content to the prompt buffer.
     * @param {Object} args - The arguments for the command.
     * @param {string} args.filename - The path to the file.
     * @param {Object} config - The configuration object.
     * @param {Object} config.promptBuffer - The prompt buffer instance.
     * @returns {Promise<string>} A success message indicating the file was loaded.
     * @throws {Error} If the file is too large, not found, or permission is denied.
     */
    async execute(args, config) {
        const { filename } = args;
        const { promptBuffer } = config;
        if (!filename) {
            throw new Error("Usage: @FILE <filename>");
        }
        try {
            const fileStat = await stat(filename);
            if (fileStat.size > MAX_FILE_SIZE) {
                throw new Error(`File too large: ${filename} (${fileStat.size} bytes > 1MB)`);
            }
            const content = await readFile(filename, "utf8");
            promptBuffer.push(content);
            return `Loaded ${filename}`;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filename}`);
            } else if (error.code === 'EACCES') {
                throw new Error(`Permission denied: ${filename}`);
            } else {
                throw error;
            }
        }
    }
}
