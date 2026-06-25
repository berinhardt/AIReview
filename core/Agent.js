import { Dirname } from "./System.js";
import { readFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
export class Agent {
   constructor(llm, personality) {
      this.llm = llm;
      this.personality = personality;
      this.cost = 0;
      this.tools = []
      this.id = null;
      this.logger = null;
      this.status = null;
   }
   Task(input) {
      const myAgent = this;
      myAgent.__STATUS("Queueing TASK");
      const result = myAgent.llm(myAgent.personality, input, {
         ...(myAgent.id !== null && { previous_interaction_id: myAgent.id }),
         tools: myAgent.tools
      });

      myAgent.__STATUS("Registering Handlers...");

      result.on("created", (id) => {
         myAgent.id = id;
         myAgent.__STATUS("Interaction created!");
      });
      result.on("status", (status) => {
         myAgent.__STATUS(status);
      })
      result.on("complete", (cost) => {
         myAgent.__STATUS("Interaction Complete");
         myAgent.cost += cost;
      });
      result.on("raw", (data) => myAgent.__LOG(data));
      return result;
   }
   __STATUS(str) {
      if (typeof this.status === "function") this.status(str);
   }
   __LOG(data) {
      if (typeof this.logger === "function") this.logger(typeof data === "string" ? data : JSON.stringify(data));
   }
   static async LoadDefaultPersonality(personality) {
      const promptFile = path.resolve(path.join(Dirname(import.meta.url), "..", "prompts", path.basename(personality, ".md") + ".md"));
      return await readFile(promptFile, "utf8");
   }
}
