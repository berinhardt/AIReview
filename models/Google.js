import { GoogleGenAI, ThinkingLevel } from "@google/genai";
async function GeminiLLMRequest(model, SystemPrompt, Input, config = {}) {
   if (model.context && SystemPrompt.length + Input.length >= model.context * 4) {
      throw new Error("Input too large");
   }
   const APIKEY = process.env.GEMINI_API_KEY;
   if (!APIKEY) throw new Error("NO API KEY FOUND!");
   const client = new GoogleGenAI({ apiKey: APIKEY });
   const interaction = await client.interactions.create({
      model: model.name,
      system_instruction: SystemPrompt,
      input: Input,

      previous_interaction_id: config.id,
      tools:(config.tools || []),

      generation_config: {
         temperature: 0.1,
         thinking_level:"high"
      },
   });

   const result = {
      id: interaction.id,
      text: interaction.output_text,
      cost: calculateCosts(model, interaction.usage)
   };

   return result;
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

export async function Gemini31FlashLite(SystemPrompt, Input, config = {}) {
   return GeminiLLMRequest({
      name: "gemini-3.1-flash-lite",
      context: 1048576,
      input: 0.25,
      output: 1.5
   }, SystemPrompt, Input, config);
}

export async function Gemini31Pro(SystemPrompt, Input, config = {}) {
   return GeminiLLMRequest({
      name: "gemini-3.1-pro-preview",
      context: 1048576,
      input: 2,
      output: 12,
   }, SystemPrompt, Input, config);
}

