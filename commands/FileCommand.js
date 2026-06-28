import { readFile, stat } from "fs/promises";
import { Command } from "./Command.js";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export class FileCommand extends Command {
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
     * @param {object} args
     * @param {object} agent
     * @param {string[]} promptBuffer
     */
    async execute(args, agent, promptBuffer) {
        const { filename } = args;
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
