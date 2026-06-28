import { readFile, stat } from "fs/promises";
import { Command } from "./Command.js";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export class FileCommand extends Command {
    constructor() {
        super("FILE");
    }

    /**
     * @param {string[]} args
     * @param {object} agent
     * @param {string[]} promptBuffer
     */
    async execute(args, agent, promptBuffer) {
        if (args.length === 0) {
            throw new Error("Usage: @FILE <filename>");
        }
        const filename = args[0];
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
