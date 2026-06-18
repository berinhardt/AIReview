import "dotenv/config";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { writeFile, readFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(execFile);

async function getGitDiff(target) {
  let ref = target || "@{u}";
  try {
    const { stdout } = await execAsync("git", ["diff", ref], { maxBuffer: 1024*1024*5 });
    if (stdout) return stdout;
  } catch (error) {
    if (ref == "@{u}") return getGitDiff("HEAD");
    else throw error;
  }
}

async function main() {
  const target = process.argv[2];
  try {
    const Diff = await getGitDiff(target);
    if (!Diff) {
      console.log("No changes to review.");
      process.exit(0);
    } 
    const APIKEY = process.env.GEMINI_API_KEY;
    if (!APIKEY) throw new Error("NO API KEY FOUND!");
    const SystemPrompt = (await readFile("SystemPrompt.txt", "utf-8")).trim();

    const client = new GoogleGenAI({
      apiKey: APIKEY
    });

  const response = await client.models.generateContent({
      model: "gemini-3.1-flash-lite",
      config: {
        systemInstruction: SystemPrompt,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW 
        },
        temperature: 0.2,
        maxOutputTokens: 8000

      },
      contents: `Review the following code diff: \n\n${Diff}`,
    });
  
    const review = response.text;
  
    if (!review) {
      throw new Error("No response from model");
    }
    console.log(review);
    await writeFile("last.log", review, "utf-8");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}
main();
