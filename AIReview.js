import "dotenv/config";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { program } from 'commander';
import path from "path";
import fs from "fs";
import { Dirname, LoadLLMModel, checkGitRepo } from './core/System.js';
import { Agent } from './core/Agent.js'
import { ReadFile, ListFiles } from "./tools/FileTools.js";
import { GitStatus, GitDiffFile } from "./tools/GitTools.js";
import { OutputHandler } from "./core/OutputHandler.js";

program.version("0.2.0")
   .argument('<repo>', 'Git Repo Path')
   .option('-m, --model <model>', 'AI model to use', "Google.Gemini31FlashLite")
   .option('-r, --revision <revision>', 'base git rev of the diff', "HEAD")
   .option('-o, --output <output>', 'output file', '-')
   .option('-l, --logfile <logfile>', 'logfile', 'last.log')
   .action(main)
   .parse(process.argv);
const OrigWarn = console.warn;
console.warn = function (...args) {
   if (args[0].indexOf("GoogleGenAI.interactions") == 0) return;
   OrigWarn.apply(console, args);
}
async function main(repo, opts) {
   let LOGFILE = null;
   try {
      LOGFILE = fs.createWriteStream(opts.logfile);
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
      await agent.setPersonality(reviewerPersonalityPath);
      pipeline(agent.logger, LOGFILE, { end: false });

      agent.addTools([ReadFile, ListFiles, GitStatus, GitDiffFile]);

      const prompt = `
      Your task is to review the changes in the repository against ${opts.revision}.
      
      ## Extra Requirements
      - The **ONLY** other tool you are allowed to use is 'FileTools_ReadFile'.
      - **DO NOT** try to write or modify any file.
      - There is no **Feature Description** for this review, infer it from the changes      

      ## TOOLING TEST
      - **IF** A tool produces unexpected or erroneous output, abort explaining how did you call it, what did you expect, what did it do, and why do you think it's unexpected or erroneous
    `;

      const stream = agent.Task(prompt);

      const appendCost = new Transform({
         transform(chunk, encoding, cb) { cb(null, chunk); },
         flush(cb) { this.push(`\n\nUSD ${agent.cost}\n`); cb(); }
      });
      const output = new OutputHandler(opts.output == "-" ? process.stdout : fs.createWriteStream(opts.output, { encoding: "utf8" }));
      agent.signal.on("status", (s) => output.setStatus(s));
      try {
         await pipeline(stream, appendCost, output, { end: false });
      } finally {
         output.end();
      }
   } catch (error) {
      console.error(`\nError: ${error.message}`);
      process.exit(1);
   } finally { }
}
