export class Command {
    constructor(name) {
        this.name = name;
    }

    /**
     * @param {string[]} args
     * @param {object} agent
     * @param {string[]} promptBuffer
     * @returns {Promise<string>}
     */
    async execute(args, agent, promptBuffer) {
        throw new Error("Method 'execute()' must be implemented.");
    }
}
