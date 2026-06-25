import { Dirname } from "./System.js";
import { readFile } from "fs/promises";
import path from "path";
import { PassThrough, Transform } from "stream";
import { pipeline } from "stream/promises";
import { AgentToolkit } from "./AgentToolkit.js";
export class Agent {
   constructor(llm, personality, chroot) {
      this.llm = llm;
      this.personality = personality;
      this.cost = 0;
      this.id = null;
      this.logger = null;
      this.status = null;
      this.tools = new AgentToolkit(chroot || "");
      this.output = null;
   }
   addTools(ary) {
      for (const t of ary) this.tools.add(t);
   }
   Task(input) {
      if (this.output == null) this.output = new PassThrough();
      const myAgent = this;
      myAgent.__STATUS("Queueing TASK");
      const result = myAgent.llm(myAgent.personality, input, {
         ...(myAgent.id !== null && { previous_interaction_id: myAgent.id }),
         tools: myAgent.tools.list()
      });
      let expected = 0;
      let queue = [];

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
      result.on("call_tool", async (data) => {
         myAgent.__STATUS(`Calling ${data.name}`)
         myAgent.__LOG(`=== PARAMS ${data.call_id}\n${JSON.stringify(data.param)}\n===\n`);
         expected++;
         let response = [{
            type: 'function_result',
            name: data.name,
            call_id: data.call_id,
            result: [{ type: 'text', text: null }]
         }];
         try {
            let t = await myAgent.tools.call(data.name, data.param);
            response[0].result[0].text = JSON.stringify(t);
            myAgent.__LOG(`=== RESULT ${data.call_id}\n${JSON.stringify(t)}\n===\n`);
         } catch (error) {
            response[0].result[0].text = JSON.stringify({ error: error.message });
         }
         if (queue) queue.push(response);
         else myAgent.Task(response);
         expected--;
      });
      result.on("end", () => {
         result.removeAllListeners();
         (async () => {
            if (queue && queue.length > 0 && expected == 0) {
               myAgent.Task(queue[0]);
            } else if (expected == 0) {
               myAgent.output.end();
               myAgent.output = null;
            }
            queue = null;
         })();
      });
      const logpipe = new Transform({
         transform(chunk, encoding, cb) {
            myAgent.__LOG(chunk.toString("utf8"));
            cb(null, chunk);
         }
      });
      pipeline(result, logpipe, this.output, { end: false });
      return this.output;
   }
   __STATUS(str) {
      if (typeof this.status === "function") this.status(str);
      this.__LOG(`${str}\n`);
   }
   __LOG(data) {
      if (typeof this.logger === "function") this.logger(typeof data === "string" ? data : JSON.stringify(data));
   }
   static async LoadDefaultPersonality(personality) {
      const promptFile = path.resolve(path.join(Dirname(import.meta.url), "..", "prompts", path.basename(personality, ".md") + ".md"));
      return await readFile(promptFile, "utf8");
   }
}
