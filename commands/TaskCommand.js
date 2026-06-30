import { Command } from "./Command.js";
import { ResetCommand } from "./ResetCommand.js";
import { RoleCommand } from "./RoleCommand.js";
import { FileCommand } from "./FileCommand.js";

/**
 * Command to chain RESET, ROLE, and FILE commands.
 * @extends Command
 */
export class TaskCommand extends Command {
    /**
     * @property {CommandMeta} META
     */
    constructor() {
        super("TASK");
        this.META = {
            name: "TASK",
            description: "Chain RESET, ROLE, and FILE commands",
            arguments: [
                { type: "string", name: "arg1", description: "Optional 'new' flag, role, or task file." },
                { type: "string", name: "arg2", description: "Optional role or task file." },
                { type: "string", name: "arg3", description: "Optional task file." }
            ]
        };
        this.resetCommand = new ResetCommand();
        this.roleCommand = new RoleCommand();
        this.fileCommand = new FileCommand();
    }

    /**
     * Executes the task command.
     * @description Chains RESET, ROLE, and FILE commands based on the provided arguments.
     * @param {Object} args - The arguments for the command.
     * @param {string} args.arg1 - The first argument.
     * @param {string} args.arg2 - The second argument.
     * @param {string} args.arg3 - The third argument.
     * @param {Object} config - The configuration object.
     * @param {Object} config.agent - The agent instance.
     * @returns {Promise<string>} A success message indicating the task was initiated.
     * @throws {Error} If the arguments are invalid or any of the chained commands fail.
     */
    async execute(args, config) {
        // args is { arg1, arg2, arg3 }
        const rawArgs = [args.arg1, args.arg2, args.arg3].filter(a => a !== "");
        
        let newFlag = false;
        let role = null;
        let task = null;

        if (rawArgs.length === 0) {
            throw new Error("Usage: @TASK [new] [<role>] <task>");
        }

        if (rawArgs[0] === 'new') {
            newFlag = true;
            if (rawArgs.length < 2) {
                throw new Error("Usage: @TASK new [<role>] <task>. Missing <task>.");
            }
            
            if (rawArgs.length === 2) {
                task = rawArgs[1];
            } else if (rawArgs.length === 3) {
                role = rawArgs[1];
                task = rawArgs[2];
            } else {
                throw new Error("Invalid number of arguments for @TASK new");
            }
        } else {
            if (rawArgs.length === 1) {
                task = rawArgs[0];
            } else if (rawArgs.length === 2) {
                role = rawArgs[0];
                task = rawArgs[1];
            } else {
                throw new Error("Invalid number of arguments for @TASK");
            }
        }

        if (!task) {
            throw new Error("Missing <task> argument.");
        }

        // Execution
        if (newFlag) {
            try {
                config.agent.Status("Executing @RESET...");
                await this.resetCommand.execute({}, config);
            } catch (e) {
                throw new Error(`@RESET command failed: ${e.message}`);
            }
        }
        
        if (role) {
            try {
                config.agent.Status(`Executing @ROLE ${role}...`);
                await this.roleCommand.execute({ filename: role }, config);
            } catch (e) {
                throw new Error(`@ROLE command failed: ${e.message}`);
            }
        }
        
        try {
            config.agent.Status(`Executing @FILE ${task}...`);
            await this.fileCommand.execute({ filename: task }, config);
        } catch (e) {
            throw new Error(`@FILE command failed: ${e.message}`);
        }
        
        return `Task '${task}' initiated successfully.`;
    }
}
