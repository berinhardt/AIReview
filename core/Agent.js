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
   async Abort() {
      if (typeof this.llm.ABORT === "function") this.llm.ABORT(this.id);
   }
   Task(input) {
      const myAgent = this;
      myAgent.__STATUS("Queueing TASK");
      const result = myAgent.llm(myAgent.personality, input, {
         ...(myAgent.id !== null && { previous_interaction_id: myAgent.id }),
         tools: myAgent.tools
      });
      const stream = new Readable({
         read() { },
         async destroy(err, cb) {
            myAgent.Abort();
            result.removeAllListeners();
            cb(err);
         }
      });

      let ACTIVE_STEP = null;
      myAgent.__STATUS("Registering Handlers...");

      result.on("created", (id, status) => {
         myAgent.id = id;
         myAgent.__STATUS("Interaction created!");
      });
      result.on("status", (id, status) => {
         myAgent.__STATUS(status);
      })
      result.on("completed", (id, cost) => {
         myAgent.__STATUS("Interaction Complete");
         stream.push(null);
         myAgent.cost += cost;
      });
      result.on("raw", (data) => myAgent.__LOG(data));
      result.on("new_step", (index, type) => {
         ACTIVE_STEP = type;
         myAgent.__STATUS(`STEP ${index} ${ACTIVE_STEP}`);
      });
      result.on("end_step", (index) => {
         ACTIVE_STEP = "";
         myAgent.__STATUS(`STEP ${index} DONE`);
      });
      result.on("update_text", (index, data) => { if ("model_output" == ACTIVE_STEP) stream.push(data.text); });
      result.on("error", (err) => {
         stream.destroy(err);
         result.removeAllListeners();
      });
      return stream;
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
