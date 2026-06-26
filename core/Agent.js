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
    let queue = [];

    myAgent.__STATUS("Registering Handlers...");

    result.on("created", (id) => {
      myAgent.id = id;
      myAgent.__STATUS("Interaction created! " + id);
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
      queue.push((async () => {
        let response = {
          type: 'function_result',
          //          name: data.name,
          call_id: data.call_id,
          result: [{ type: 'text', text: null }]
        };
        try {
          let t = await myAgent.tools.call(data.name, data.param);
          response.result = t;
        } catch (error) {
          response.result = { error: error.message };
          response.is_error = true;
        }
        myAgent.__LOG(`=== RESULT ${data.call_id}\n${JSON.stringify(response)}\n===\n`);
        return response;
      })());
    });
    result.on("error", (error) => {
      myAgent.__LOG(error);
    })
    result.on("end", () => {
      result.removeAllListeners();
      (async () => {
        if (queue.length > 0) {
          const chained = await Promise.all(queue);
          console.log(chained);
          setImmediate(() => myAgent.Task(chained));
        } else {
          myAgent.output.end();
          myAgent.output = null;
        }
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
