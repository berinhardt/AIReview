import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { EventEmitter } from "events";
function GeminiLLMRequest(model, SystemPrompt, Input, config = {}) {
   const emitter = new EventEmitter();
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

         for await (const data of interaction) {
            emitter.emit("raw", data);
            switch (data.event_type) {
               case 'interaction.created':
                  emitter.emit("created", data.interaction.id, data.interaction.status);
                  break;
               case 'interaction.status_update':
                  emitter.emit("status", data.interaction_id, data.status);
                  break;
               case 'step.start':
                  emitter.emit("new_step", data.index, data.step.type);
                  break;
               case 'step.delta':
                  emitter.emit("update_" + data.delta.type, data.index, data.delta);
                  break;
               case 'step.stop':
                  emitter.emit("end_step", data.index);
                  break;
               case 'interaction.completed':
                  emitter.emit("completed", data.interaction.id, calculateCosts(model, data.interaction.usage));
                  break;
            };
         }
      } catch (err) {
         emitter.emit("error", err);
      }
   })();
   return emitter;
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

