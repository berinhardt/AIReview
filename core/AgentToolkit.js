import path from "path";
export class AgentToolkit {
  constructor(chroot) {
    this.tools = [];
    this.map = {
      RESERVED_Echo: async (v) => v,
      RESERVED_Noop: async () => { }
    };
    this.ENV = {
      cwd: path.resolve(chroot)
    };
  }
  add(tool) {
    if (typeof tool !== "function" || typeof tool.TOOLDEF === "undefined") throw new Error("Invalid tool");
    const toolName = tool.TOOLDEF.name;
    if (typeof this.map[toolName] !== "undefined") throw new Error(`Duplicated tool: ${toolName}`);
    this.tools.push(tool.TOOLDEF);
    this.map[tool.TOOLDEF.name] = tool;
  }
  list() {
    return this.tools;
  }
  async call(name, param) {
    if (typeof this.map[name] === "undefined") throw new Error(`Unknown tool: ${name}`);
    return await this.map[name](param, this.ENV);
  }
}
