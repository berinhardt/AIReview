import { Dirname } from "./System.js";
import { readFile } from "fs/promises";
import path from "path";
import { PassThrough, Transform } from "stream";
import { pipeline } from "stream/promises";
import { AgentToolkit } from "./AgentToolkit.js";
import { EventEmitter } from "events";

export class Agent {
  constructor(llm, personality, chroot = "", maxRecursionDepth = 100) {
    this.llm = llm;
    this.personality = personality;
    this.cost = 0;
    this.id = null;
    this.logger = new PassThrough();
    this.signal = new EventEmitter();
    this.tools = new AgentToolkit(chroot);
    this.maxRecursionDepth = maxRecursionDepth;
  }
  addTools(ary) {
    for (const t of ary) this.tools.add(t);
  }
  restart() {
    this.id = null;
  }
  async setPersonality(personalityPath) {
    const content = await readFile(personalityPath, "utf8");
    this.personality = content;
  }
  Task(input, depth = 0, outputStream = null) {
    const stream = outputStream || new PassThrough();
    const myAgent = this;
    myAgent.Status(`Queueing TASK (depth: ${depth})`);
    const result = myAgent.llm(myAgent.personality, input, {
      ...(myAgent.id !== null && { previous_interaction_id: myAgent.id }),
      tools: myAgent.tools.list()
    });
    let queue = [];

    myAgent.Status("Registering Handlers...");

    result.on("created", (id) => {
      myAgent.id = id;
      myAgent.Status("Interaction created! " + id);
    });
    result.on("status", (status) => {
      myAgent.Status(status);
    })
    result.on("raw", (status) => {
      myAgent.Log(status);
    })
    result.on("request", (r) => myAgent.Log("Request", r));
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
      myAgent.Log(error);
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
            // Explicitly destroy the result stream to abort the LLM interaction
            if (typeof result.destroy === 'function') {
              result.destroy(err);
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
      myAgent.Log(`Pipeline error: ${err.message}`);
      if (!stream.destroyed) {
        stream.emit("error", err);
      }
    });
    return stream;
  }
  Status(str) {
    this.signal.emit("status", str);
    this.Log(`${str}\n`);
  }
  Log(data) {
    this.logger.write(typeof data === "string" ? data : JSON.stringify(data));
  }
  static async LoadDefaultPersonality(personality) {
    const promptFile = path.resolve(path.join(Dirname(import.meta.url), "..", "prompts", path.basename(personality, ".md") + ".md"));
    return await readFile(promptFile, "utf8");
  }
}
