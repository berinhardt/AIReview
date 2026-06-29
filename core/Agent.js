import { readFile } from "fs/promises";
import path from "path";
import { PassThrough, Transform } from "stream";
import { pipeline } from "stream/promises";
import { AgentToolkit } from "./AgentToolkit.js";
import { EventEmitter } from "events";

export class Agent {
  constructor(llm, chroot = "", maxRecursionDepth = 100) {
    this.llm = llm;
    this.personality = null;
    this.personalityName = "Default";
    this.cost = 0;
    this.id = null;
    this.logger = new PassThrough();
    this.signal = new EventEmitter();
    this.tools = new AgentToolkit(chroot);
    this.maxRecursionDepth = maxRecursionDepth;
    this.logger.setMaxListeners(20);
  }
  addTools(ary) {
    for (const t of ary) this.tools.add(t);
  }
  restart() {
    this.id = null;
  }
  async setPersonality(personalityInput, isPath = true) {
    if (isPath) {
      const content = await readFile(personalityInput, "utf8");
      this.personality = content;
      this.personalityName = path.basename(personalityInput, ".md");
    } else {
      this.personality = personalityInput;
      this.personalityName = "Default";
    }
  }
  getPersonalityName() {
    return this.personalityName;
  }
  Task(input, depth = 0, outputStream = null) {
    const stream = outputStream || new PassThrough();
    const myAgent = this;
    myAgent.Status(`Queueing TASK (depth: ${depth})`);
    const result = myAgent.llm.request(myAgent.personality, input, {
      ...(myAgent.id !== null && { previous_interaction_id: myAgent.id }),
      tools: myAgent.tools.list()
    });
    let queue = [];

    myAgent.Status("Registering Handlers...");

    result.on("request", (req) => {
      myAgent.Log(`REQUEST ${JSON.stringify(req)}\n`);
    });
    result.on("created", (id) => {
      myAgent.id = id;
      myAgent.Status("Interaction created! " + id);
    });
    result.on("status", (status) => {
      myAgent.Status(status);
    })
    result.on("raw", (status) => {
      myAgent.Log(`RAW ${JSON.stringify(status)}\n`);
    })
    result.on("complete", (cost) => {
      myAgent.Status("Interaction Complete");
      myAgent.cost += cost;
    });
    result.on("call_tool", (data) => {
      myAgent.Status(`Calling ${data.name}`)
      myAgent.Log(`=== PARAMS ${data.call_id}\n${JSON.stringify(data.param)}\n===\n`);
      queue.push(data);
    });
    result.on("error", (error) => {
      myAgent.Log(`ERROR ${error}\n`);
    })
    result.on("end", () => {
      result.removeAllListeners();
      (async () => {
        if (queue.length > 0) {
          const chained = [];
          for (const data of queue) {
            let response = {
              type: 'function_result',
              name: data.name,
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
            myAgent.Log(`=== RESULT ${data.call_id}\n${JSON.stringify(response)}\n===\n`);
            chained.push(response);
          }
          if (depth + 1 >= myAgent.maxRecursionDepth) {
            myAgent.Log("Max recursion depth reached. Stopping.");
            const err = new Error("Max recursion depth reached");
            // Explicitly call abort on the LLM instance
            if (myAgent.id !== null) {
              myAgent.llm.abort(myAgent.id);
            }
            if (!stream.destroyed) {
              stream.emit("error", err);
              stream.end();
            }
          } else {
            setImmediate(() => myAgent.Task(chained, depth + 1, stream));
          }
        } else {
          if (!stream.destroyed) {
            stream.end();
          }
        }
      })();
    });
    const logpipe = new Transform({
      transform(chunk, encoding, cb) {
        myAgent.Log(chunk.toString("utf8"));
        cb(null, chunk);
      }
    });
    pipeline(result, logpipe, stream, { end: false }).catch((err) => {
      myAgent.Log(`Pipeline error: ${err.message}\n`);
      if (!stream.destroyed)
        stream.emit("error", err);
    });
    return stream;
  }
  Status(str) {
    this.signal.emit("status", str);
    this.Log(`[STATUS] ${str}\n`);
  }
  Log(data) {
    this.logger.write(typeof data === "string" ? data : JSON.stringify(data));
  }
}
