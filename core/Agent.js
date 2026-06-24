export class Agent {
   constructor(llm, personality) {
      this.llm = llm;
      this.personality = personality;
      this.cost = 0;
      this.tools = []
      this.id = null;
   }
   async Task(input) {
      const result = await this.llm(this.personality, input, {
         ...(this.id !== null && { previous_interaction_id: this.id }),
         tools: this.tools
      });
      this.cost += result.cost;
      this.id = result.id;
      return result;
   }
}
