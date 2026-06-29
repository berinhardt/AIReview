import { Command } from "./Command.js";

export class ResetCommand extends Command {
    constructor() {
        super("RESET");
        this.META = {
            name: "RESET",
            description: "Reset the agent session",
            arguments: []
        };
    }

    async execute(args, agent, promptBuffer) {
        agent.restart();
        return "Agent reset.";
    }
}
