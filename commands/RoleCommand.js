import { Command } from "./Command.js";
import path from "path";

/**
 * Command to change the agent's personality.
 * @extends Command
 */
export class RoleCommand extends Command {
   /**
    * @property {CommandMeta} META
    */
   constructor() {
      super("ROLE");
      this.META = {
         name: "ROLE",
         description: "Change the agent's personality",
         arguments: [
            { name: "filename", type: "string", description: "The path to the personality file." }
         ]
      };
   }

   /**
    * Executes the role change command.
    * @description Sets the agent's personality based on the provided file.
    * @param {Object} args - The arguments for the command.
    * @param {string} args.filename - The path to the personality file.
    * @param {Object} config - The configuration object.
    * @param {Object} config.agent - The agent instance.
    * @returns {Promise<string>} A success message indicating the role was loaded.
    * @throws {Error} If the filename is missing or an error occurs during execution.
    */
   async execute(args, config) {
      const filename = args.filename;
      if (!filename) {
         throw new Error("Error: Filename required.");
      }

      await config.agent.setPersonality(filename);
      return `Role loaded successfully from ${filename}.`;
   }
}
