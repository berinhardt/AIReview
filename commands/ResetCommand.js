import { Command } from "./Command.js";

/**
 * Command to reset the agent session.
 * @extends Command
 */
export class ResetCommand extends Command {
    /**
     * @property {CommandMeta} META
     */
    constructor() {
        super("RESET");
        this.META = {
            name: "RESET",
            description: "Reset the agent session",
            arguments: []
        };
    }

    /**
     * Executes the reset command.
     * @description Restarts the agent and clears the prompt buffer.
     * @param {Object} args - The arguments for the command (none).
     * @param {Object} config - The configuration object.
     * @param {Object} config.agent - The agent instance.
     * @param {Object} config.promptBuffer - The prompt buffer instance.
     * @returns {Promise<string>} A success message indicating the reset.
     * @throws {Error} If an error occurs during execution.
     */
    async execute(args, config) {
        config.agent.restart();
        config.promptBuffer.length = 0;
        return "Agent and input buffer reset.";
    }
}
