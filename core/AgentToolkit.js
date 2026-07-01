import path from "path";

/**
 * @typedef {Object} ToolParameter
 * @property {"object"} type - Must be "object".
 * @property {Object.<string, {type: string, description: string}>} properties - Object where keys are parameter names, and values are objects containing type and description.
 * @property {string[]} required - Array of mandatory parameter names.
 */

/**
 * @typedef {Object} TOOLDEF
 * @property {"function"} type - Must be "function".
 * @property {string} name - Unique identifier for the tool.
 * @property {string} description - Human-readable purpose of the tool.
 * @property {ToolParameter} parameters - JSON Schema format parameters.
 */

/**
 * Manages a collection of tools that can be executed by agents.
 * @param {string} chroot - root of the sandbox for the tools
 */
export class AgentToolkit {
   constructor(notesDir, targetDir) {
      this.tools = [];
      this.map = {};
      this.ENV = {
         notesDir: path.resolve(notesDir),
         targetDir: targetDir ? path.resolve(targetDir) : null
      };
   }

   /**
    * Registers a new tool in the toolkit.
    * @param {Function & {TOOLDEF: TOOLDEF}} tool - The tool function, which must have a valid TOOLDEF property.
    */
   add(tool) {
      if (typeof tool !== "function" || typeof tool.TOOLDEF === "undefined") throw new Error("Invalid tool");
      const toolName = tool.TOOLDEF.name;
      if (typeof this.map[toolName] !== "undefined") throw new Error(`Duplicated tool: ${toolName}`);
      this.tools.push(tool.TOOLDEF);
      this.map[tool.TOOLDEF.name] = tool;
   }

   /**
    * Returns a list of all registered tools.
    * @returns {TOOLDEF[]} An array of all registered TOOLDEF objects.
    */
   list() {
      return this.tools;
   }

   /**
    * Executes a registered tool.
    * @param {string} name - The name of the tool to execute.
    * @param {Object} param - The parameters to pass to the tool.
    * @param {Object} agent - The agent instance executing the tool.
    * @returns {Promise<*>} The result of the tool execution.
    * @throws {Error} Throws an error if the tool name is not found in the registry.
    */
   async call(name, param, agent) {
      if (typeof this.map[name] === "undefined") throw new Error(`Unknown tool: ${name}`);
      const env = { ...this.ENV, agent };
      return await this.map[name](param, env);
   }
}
