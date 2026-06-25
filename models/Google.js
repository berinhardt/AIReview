import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { Readable } from "stream";
function GeminiLLMRequest(model, SystemPrompt, Input, config = {}) {
   const abortContext = {
      id: null
   };
   const stream = new Readable({
      read() { },
      async destroy(err, cb) {
         if (abortContext.id !== null) {
            this.emit("status", "Aborting...");
            await GeminiAbort(abortContext.id);
         }
         cb(err);
      }
   });
   (async () => {
      try {
         if (model.context && SystemPrompt.length + Input.length >= model.context * 4) {
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
         const interaction = await client.interactions.create({
            model: model.name,
            system_instruction: SystemPrompt,
            input: Input,
            ...(previous_interaction_id !== null && { previous_interaction_id }),
            ...(tools !== null && { tools }),
            ...(response_format !== null && { response_format }),
            stream: true,
            generation_config: {
               temperature: temperature,
               thinking_level: thinking_level
            },
         });
         let DeltaHandler = null;
         for await (const data of interaction) {
            if (stream.closed) break;
            stream.emit("raw", data);
            switch (data.event_type) {
               case 'interaction.created':
                  abortContext.id = data.interaction.id;
                  stream.emit("created", data.interaction.id);
                  break;
               case 'interaction.status_update':
                  stream.emit("status", data.status);
                  break;
               case 'step.start':
                  DeltaHandler = DeltaHandlerStore[data.step.type];
                  if (DeltaHandler) DeltaHandler = DeltaHandler(data.step, stream);
                  stream.emit("new_step", data.index, data.step.type);
                  stream.emit("status", `#${data.index}> ${data.step.type}`);
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
                  abortContext.id = null;
                  stream.emit("complete", calculateCosts(model, data.interaction.usage));
                  stream.push(null);
                  break;
            };
         }
      } catch (err) {
         stream.emit("error", err);
      }
   })();
   return stream;
}
const DeltaHandlerStore = {
   model_output: (step, stream) => ({
      parse(delta) { delta.type == "text" && stream.push(delta.text); },
      end() { stream.push("\n"); }
   }),
   function_call: (step, stream) => ({
      data: {
         call_id: step.id,
         name: step.name,
         param: []
      },
      parse(delta) { delta.type == "arguments_delta" && this.data.param.push(delta.arguments); },
      end() { this.data.param = JSON.parse(this.data.param.join("")); stream.emit("call_tool", this.data); }
   })
}

async function GeminiAbort(id) {
   const APIKEY = process.env.GEMINI_API_KEY;
   if (!APIKEY) throw new Error("NO API KEY FOUND!");
   const client = new GoogleGenAI({ apiKey: APIKEY });
   const interaction = await client.interactions.cancel(id);
   console.error("GEMINI ABORT", interaction.status);
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

export function Gemini31FlashLite(SystemPrompt, Input, config = {}) {
   return GeminiLLMRequest({
      name: "gemini-3.1-flash-lite",
      context: 1048576,
      input: 0.25,
      output: 1.5
   }, SystemPrompt, Input, config);
}
Gemini31FlashLite.ABORT = GeminiAbort;

export function Gemini31Pro(SystemPrompt, Input, config = {}) {
   return GeminiLLMRequest({
      name: "gemini-3.1-pro-preview",
      context: 1048576,
      input: 2,
      output: 12,
   }, SystemPrompt, Input, config);
}
Gemini31Pro.ABORT = GeminiAbort;

