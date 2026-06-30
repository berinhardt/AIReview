import "dotenv/config";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { program } from 'commander';
import path from "path";
import fs from "fs";
import { Dirname, LoadLLMModel, checkGitRepo } from './core/System.js';
import { Agent } from './core/Agent.js'
import { createWriteStream } from "fs";
import { ReadFile, ListFiles } from "./tools/FileTools.js";
import { GitStatus, GitDiff } from "./tools/GitTools.js";
import { OutputHandler } from "./core/OutputHandler.js";

program.version("0.2.0")
   .argument('<repo>', 'Git Repo Path')
   .option('-m, --model <model>', 'AI model to use', "Google.Gemini31FlashLite")
   .option('-r, --revision <revision>', 'base git rev of the diff', "HEAD")
   .option('-o, --output <output>', 'log file', '-')
   .action(main)
   .parse(process.argv);

async function main(repo, opts) {

   try {
      // Validate repo path
      const absoluteRepoPath = path.resolve(repo);
      if (!fs.existsSync(absoluteRepoPath)) {
         throw new Error(`Repository path does not exist: ${absoluteRepoPath}`);
      }
      try {
         checkGitRepo(absoluteRepoPath);
      } catch (e) {
         throw new Error(`Invalid repository: ${e.message}`);
      }

      const model = await LoadLLMModel(opts.model);

      const agent = new Agent(model, absoluteRepoPath);
      const reviewerPersonalityPath = path.join(Dirname(import.meta.url), "prompts", "Reviewer.md");
      await agent.setPersonality(reviewerPersonalityPath, true);

      agent.addTools([ReadFile, ListFiles, GitStatus, GitDiff]);


      const prompt = `
      Your task is to review the changes in the repository against ${opts.revision}.
      
      1. Use 'ListFiles' with { "path": ".", "recursive": true } to understand the project structure.
      2. Use 'GitStatus' to see the status of the files.
      3. Use 'GitDiff' to understand the changes for each modified file.
    `;

      const stream = agent.Task(prompt);

      const appendCost = new Transform({
         transform(chunk, encoding, cb) { cb(null, chunk); },
         flush(cb) { this.push(`\n\nUSD ${agent.cost}\n`); cb(); }
      });
      const output = new OutputHandler(opts.output == "-" ? process.stdout : createWriteStream(opts.output, { encoding: "utf8" }));
      agent.signal.on("status", (s) => output.setStatus(s));
      try {
         await pipeline(stream, appendCost, output, { end: false });
      } finally {
         output.end();
      }
   } catch (error) {
      console.error(`\nError: ${error.message}`);
      process.exit(1);
   } finally {
   }
}
