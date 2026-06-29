export class CommandRegistry {
    constructor() {
        this.commands = new Map();
    }

    register(command) {
        if (!command.META || !command.META.name) {
            throw new Error("Command must have a META property with a name.");
        }
        const name = command.META.name.toUpperCase();
        if (this.commands.has(name)) {
            throw new Error(`Command with name '${name}' already registered.`);
        }
        this.commands.set(name, command);
    }

    async execute(inputString, config) {
        if (!inputString.startsWith('@')) {
            throw new Error("Input must start with '@'.");
        }

        const parts = inputString.substring(1).trim().split(/\s+/);
        const commandName = parts[0].toUpperCase();
        const rawArgs = parts.slice(1);

        const command = this.commands.get(commandName);
        if (!command) {
            return `Unknown command: @${commandName}`;
        }

        const parsedArgs = this._parseArguments(command.META.arguments, rawArgs);
        return await command.execute(parsedArgs, config);
    }

    _parseArguments(argDefinitions, rawArgs) {
        const parsedArgs = {};
        if (!argDefinitions) return parsedArgs;

        argDefinitions.forEach((def, index) => {
            const rawValue = rawArgs[index];
            if (def.type === 'string') {
                parsedArgs[def.name] = rawValue || "";
            } else {
                // Handle other types if needed
                parsedArgs[def.name] = rawValue;
            }
        });
        return parsedArgs;
    }
}
