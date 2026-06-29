export class Command {
    constructor(name) {
        this.name = name;
    }

    /**
     * @param {string[]} args
     * @param {object} config
     * @returns {Promise<string>}
     */
    async execute(args, config) {
        throw new Error("Method 'execute()' must be implemented.");
    }
}
