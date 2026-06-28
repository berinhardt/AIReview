import { Command } from "./Command.js";

export class RestartCommand extends Command {
    constructor() {
        super("RESTART");
        this.META = {
            name: "RESTART",
            description: "Restart the agent session",
            arguments: []
        };
    }

    async execute(args, agent, promptBuffer) {
        agent.restart();
        return "Agent restarted.";
    }
}
