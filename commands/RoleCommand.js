import { Command } from "./Command.js";
import path from "path";

export class RoleCommand extends Command {
  constructor() {
    super("ROLE");
    this.META = {
      name: "ROLE",
      description: "Change the agent's personality",
      arguments: [
        { name: "filename", type: "string" }
      ]
    };
  }

  async execute(args, agent, promptBuffer) {
    const filename = args.filename;
    if (!filename) {
      throw "Error: Filename required.";
    }

    // The requirement says "relative to the current working directory (CWD)"
    const filePath = path.resolve(process.cwd(), filename);

    await agent.setPersonality(filePath);
    return `Role loaded successfully from ${filename}.`;
  }
}
