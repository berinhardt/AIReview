import { GoogleGenAI, ThinkingLevel } from "@google/genai";
async function GeminiLLMRequest(model, SystemPrompt, Diff) {
   if (model.context && SystemPrompt.length + Diff.length >= model.context * 4) {
      throw new Error("Diff too large");
   }
   const APIKEY = process.env.GEMINI_API_KEY;
   if (!APIKEY) throw new Error("NO API KEY FOUND!");
   const client = new GoogleGenAI({ apiKey: APIKEY });
   const response = await client.models.generateContent({
      model: model.name,
      config: {
         systemInstruction: SystemPrompt,
         thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH
         }
      },
      contents: `Review the following code diff: \n\n${Diff}`,
   });

   const result = {
      text: response.text,
      cost: calculateCosts(model, response.usageMetadata)
   };

   return result;
}
function calculateCosts(model, usage) {
   const { promptTokenCount = 0, candidatesTokenCount = 0, thoughtsTokenCount = 0 } = usage || {};
   const { input = 0, output = 0 } = model;
   const cost = (promptTokenCount * input + (candidatesTokenCount + thoughtsTokenCount) * output) / 1e6;
   return Number(cost.toFixed(6));
}

export async function Gemini31FlashLite(SystemPrompt, Diff) {
   return GeminiLLMRequest({
      name: "gemini-3.1-flash-lite",
      context: 1048576,
      input: 0.25,
      output: 1.5
   }, SystemPrompt, Diff);
}

export async function Gemini31Pro(SystemPrompt, Diff) {
   return GeminiLLMRequest({
      name: "gemini-3.1-pro-preview",
      context: 1048576,
      input: 2,
      output: 12,
   }, SystemPrompt, Diff);
}

