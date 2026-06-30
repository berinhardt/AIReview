/**
 * @typedef {Object} CommandMeta
 * @property {string} name - The name of the command.
 * @property {string} [description] - A brief description of the command.
 * @property {Array<{name: string, type: string, description?: string}>} [arguments] - The arguments the command accepts.
 */

/**
 * Base class for all commands.
 */
export class Command {
    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * Executes the command.
     * @param {string[]} args - The arguments for the command.
     * @param {object} config - The configuration object.
     * @returns {Promise<string>} The result of the command execution.
     * @throws {Error} If the method is not implemented.
     */
    async execute(args, config) {
        throw new Error("Method 'execute()' must be implemented.");
    }
}
