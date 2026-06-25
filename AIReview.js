import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { program } from 'commander';
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { Dirname, LoadLLMModel } from './core/System.js';
import { Agent } from './core/Agent.js'
import { createWriteStream } from "fs";

const execAsync = promisify(execFile);

program.version("0.2.0")
   .argument('[repo...]', 'Git Repo Path', ['.'])
   .option('-m, --model <model>', 'AI model to use', "Google.Gemini31FlashLite")
   .option('-r, --revision <revision>', 'base git rev of the diff', null)
   .option('-o, --output <output>', 'log file', '-')
   .action(main)
   .parse(process.argv);

async function getGitDiff(repo, rev) {
   repo = path.resolve(repo)
   try {
      await execAsync("git", ["rev-parse", "--is-inside-work-tree"]);
   } catch (error) {
      throw new Error(`${repo} is not a vaild git repo`);
   }
   rev = rev || "@{u}";
   try {
      const { stdout } = await execAsync("git", ["diff", rev], {
         maxBuffer: 1024 * 1024 * 5,
         cwd: repo
      });
      if (stdout) return stdout;
   } catch (error) {
      /** 
       * this is not an infinite loop: 
       * calling getGitDiff("HEAD") will never end with rev == "@{u}"
       * if getGitDiff("HEAD") throws, rev is "HEAD", so this throws the error
       **/
      if (rev == "@{u}") return getGitDiff(repo, "HEAD");
      else throw error;
   }
}
async function main(repos, opts) {
   try {
      const model = await LoadLLMModel(opts.model);

      process.stderr.write("[STATUS] Fetching diff...\n");
      let Diff = "";
      for (const repo of repos)
         Diff += (await getGitDiff(repo, opts.revision)) + "\n";

      if (!Diff) {
         throw new Error("No changes to review.");
      }
      const agent = new Agent(model, await Agent.LoadDefaultPersonality("Reviewer"));
      agent.status = (s) => process.stderr.write(`[STATUS] ${s}\n`);
      const stream = agent.Task(`Review the following code diff: \n\n${Diff}`);

      process.stderr.write(`[STATUS] Connecting to ${opts.model}...\n`);
      const appendCost = new Transform({
         transform(chunk, encoding, cb) { cb(null, chunk); },
         flush(cb) { this.push(`\n\nUSD ${agent.cost}\n`); cb(); }
      });
      const output = opts.output == "-" ? process.stdout : createWriteStream(opts.output, { encoding: "utf8" });
      try {
         await pipeline(stream, appendCost, output, { end: false });
      } finally {
         if (output != process.stdout && !output.closed) output.end();
      }
   } catch (error) {
      console.error(error);
      process.exit(1);
   }
}

