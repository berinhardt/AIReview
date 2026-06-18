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
            thinkingLevel: ThinkingLevel.MEDIUM
         },
         temperature: 0.2
      },
      contents: `Review the following code diff: \n\n${Diff}`,
   });

   return response.text;
}

export async function Gemini31FlashLite(SystemPrompt, Diff) {
   return GeminiLLMRequest({
      name: "gemini-3.1-flash-lite",
      context: 1048576
   }, SystemPrompt, Diff);
}
