import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import { program } from 'commander';
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { Dirname, LoadLLMModel } from './core/System.js';

const execAsync = promisify(execFile);

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

      let Diff = "";
      for (const repo of repos)
         Diff += (await getGitDiff(repo, opts.revision)) + "\n";

      if (!Diff) {
         throw new Error("No changes to review.");
      }
      const SystemPrompt = (await readFile(path.join(Dirname(import.meta.url), "SystemPrompt.txt"), "utf-8")).trim();

      const review = await model(SystemPrompt, `Review the following code diff: \n\n${Diff}`);

      if (!review) {
         throw new Error("No response from model");
      }
      const result = review.text + `\n\nUSD ${review.cost}`;
      if (opts.output == "-") {
         console.log(result);
      } else {
         await writeFile(opts.output, result, "utf-8");
      }
   } catch (error) {
      console.error(error);
      process.exit(1);
   }
}
program.version("0.2.0")
   .argument('[repo...]', 'Git Repo Path', ['.'])
   .option('-m, --model <model>', 'AI model to use', "Google.Gemini31FlashLite")
   .option('-r, --revision <revision>', 'base git rev of the diff', null)
   .option('-o, --output <output>', 'log file', 'last.log')
   .action(main)
   .parse(process.argv);

