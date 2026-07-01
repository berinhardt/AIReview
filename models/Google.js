import { GoogleGenAI } from "@google/genai";
import { time } from "console";
import { Readable } from "stream";

class GeminiLLM {
  constructor(modelConfig) {
    this.modelConfig = modelConfig;
    this.lastRequest = 0;
  }

  getName() {
    return this.modelConfig.name;
  }

  async abort(interactionId) {
    const APIKEY = process.env.GEMINI_API_KEY;
    if (!APIKEY) throw new Error("NO API KEY FOUND!");
    const client = new GoogleGenAI({ apiKey: APIKEY });
    const interaction = await client.interactions.cancel(interactionId);
    console.error("GEMINI ABORT", interaction.status);
  }

  request(SystemPrompt, Input, config = {}) {
    const stream = new Readable({
      read() { }
    });

    const sendRequest = (async () => {
      try {
        if (this.modelConfig.context && SystemPrompt.length + Input.length >= this.modelConfig.context * 4) {
          throw new Error("Input too large");
        }
        const APIKEY = process.env.GEMINI_API_KEY;
        if (!APIKEY) throw new Error("NO API KEY FOUND!");
        const client = new GoogleGenAI({ apiKey: APIKEY });
        const {
          temperature = 0.0,
          thinking_level = "high",
          tools = null,
          response_format = null,
          previous_interaction_id = null,
        } = config || {};
        const request = {
          model: this.modelConfig.name,
          system_instruction: SystemPrompt,
          input: Input,
          ...(previous_interaction_id !== null && { previous_interaction_id }),
          ...(tools !== null && { tools }),
          ...(response_format !== null && { response_format }),
          stream: true,
          generation_config: {
            temperature: temperature,
            thinking_level: thinking_level,
            thinking_summaries: 'auto'
          },
        }

        // Emit the request object
        stream.emit("request", request);

        const interaction = await client.interactions.create(request);
        this.lastRequest = Date.now();
        let DeltaHandler = null;
        for await (const data of interaction) {
          if (stream.closed) break;
          stream.emit("raw", data);
          switch (data.event_type) {
            case 'interaction.created':
              stream.emit("created", data.interaction.id);
              break;
            case 'interaction.status_update':
              stream.emit("status", data.status);
              break;
            case 'step.start':
              DeltaHandler = DeltaHandlerStore[data.step.type];
              if (DeltaHandler) DeltaHandler = DeltaHandler(data.step, stream);
              stream.emit("new_step", data.index, data.step.type);
              stream.emit("status", `#${data.index} > ${data.step.type}`);
              break;
            case 'step.delta':
              stream.emit("update_" + data.delta.type, data.index, data.delta);
              if (DeltaHandler) DeltaHandler.parse(data.delta);
              break;
            case 'step.stop':
              if (DeltaHandler) DeltaHandler.end();
              DeltaHandler = null;
              stream.emit("end_step", data.index);
              stream.emit("status", `#${data.index} done`);
              break;
            case 'interaction.completed':
              stream.emit("complete", calculateCosts(this.modelConfig, data.interaction.usage));
              stream.push(null);
              break;
            case 'error':
              throw new Error(data.error.message);
          };
        }
      } catch (err) {
        stream.emit("error", err);
      }
    })

    const now = Date.now();
    const elapsed = (now - this.lastRequest);
    const timeout = Math.max(0, 60000 / this.RPM_LIMIT - elapsed);
    stream.emit("status", `Waiting... ${timeout}ms`);
    setTimeout(sendRequest, timeout);

    return stream;
  }
}

const DeltaHandlerStore = {
  model_output: (step, stream) => {
    stream.push("[OUTPUT]\n");
    if (step.content) for (const content of step.content) content.text && stream.push(content.text);
    return ({
      parse(delta) { delta.type == "text" && stream.push(delta.text); },
      end() { stream.push("\n"); }
    })
  },
  thought: (step, stream) => {
    stream.push("[THINKING]\n");
    if (step.summary) for (const summary of step.summary) summary.text && stream.push(summary.text);
    return ({
      parse(delta) { delta.content && stream.push(delta.content.text); },
      end() { stream.push("\n"); }
    });
  },
  function_call: (step, stream) => ({
    data: {
      call_id: step.id,
      name: step.name,
      param: []
    },
    parse(delta) { delta.type == "arguments_delta" && this.data.param.push(delta.arguments); },
    end() {
      const rawArgs = this.data.param.join("");
      try {
        this.data.param = rawArgs ? JSON.parse(rawArgs) : {};
        stream.emit("call_tool", this.data);
      } catch (e) {
        stream.emit("error", "Invalid JSON received");
      }
    }
  })
}

function calculateCosts(model, usage) {
  const {
    total_input_tokens, totalInputTokens,
    total_output_tokens, totalOutputTokens,
    total_thought_tokens, totalThoughtTokens
  } = usage || {};

  const promptTokens = totalInputTokens ?? total_input_tokens ?? 0;
  const outputTokens = totalOutputTokens ?? total_output_tokens ?? 0;
  const thoughtTokens = totalThoughtTokens ?? total_thought_tokens ?? 0;

  const { input = 0, output = 0 } = model;

  const cost = (promptTokens * input + (outputTokens + thoughtTokens) * output) / 1e6;
  return Number(cost.toFixed(6));
}

export const Gemini31FlashLite = new GeminiLLM({
  name: "gemini-3.1-flash-lite",
  context: 1048576,
  input: 0.25,
  output: 1.5
});

export const Gemini31Pro = new GeminiLLM({
  name: "gemini-3.1-pro-preview",
  context: 1048576,
  input: 2,
  output: 12,
});
export function GeminiNoWarn() {
  const OrigWarn = console.warn;
  console.warn = function (...args) {
    if (args[0].indexOf("GoogleGenAI.interactions") == 0) return;
    OrigWarn.apply(console, args);
  }
}
