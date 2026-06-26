import "dotenv/config";
import { readFile } from "fs/promises";
import readline from 'readline/promises';
import { program } from 'commander';
import { LoadLLMModel, isTransientError, validateNonNegativeInteger } from './core/System.js';
import { Agent } from './core/Agent.js'
import { text } from "stream/consumers";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { CreateFile, SearchReplaceFile, ReadFile } from "./tools/FileTools.js";

program.version("0.2.0")
   .option('-p, --personality <personality>', 'AI personality file', null)
   .option('-t, --task <task>', 'Task file', (val, memo) => [...memo, val], [])
   .option('-m, --model <model>', 'AI model to use', "Google.Gemini31FlashLite")
   .option('-d, --chroot <dir>', 'Exposed root of paths to AI', "sandbox")
   .option('-o, --output <output>', 'Output file', '-')
   .option('-l, --logfile <logfile>', 'Agent log file', 'last.log')
   .action(main)
   .parse(process.argv);

async function executeTask(agent, task, output) {
   if (!task) return;

   const stream = agent.Task(task);
   const appendCost = new Transform({
      transform(chunk, encoding, cb) { cb(null, chunk); },
      flush(cb) { this.push(`\n\nUSD ${agent.cost}\n`); cb(); }
   });

   // Use pipeline to write the buffer to the output stream
   await pipeline(stream, appendCost, output, { end: false });
}
async function main(opts) {
   let LOGFILE;
   try {
      LOGFILE = createWriteStream(opts.logfile);
      const model = await LoadLLMModel(opts.model);
      const personality = opts.personality ? await readFile(opts.personality, "utf8") : await Agent.LoadDefaultPersonality('Default');
      const agent = new Agent(model, personality, opts.chroot);

      agent.addTools([CreateFile, ReadFile, SearchReplaceFile]);
      agent.status = (str) => process.stderr.write(`[STATUS] ${str}\n`);
      agent.logger = (str) => LOGFILE.write(str);

      const output = opts.output == "-" ? process.stdout : createWriteStream(opts.output, { encoding: "utf8" });

      const tasks = opts.task.length === 0 ? ['-'] : opts.task;

      let cachedStdin = null;
      const getStdin = async () => {
         if (cachedStdin === null) {
            cachedStdin = await text(process.stdin);
         }
         return cachedStdin;
      };

      for (const task of tasks) {
         try {
            if (task !== "-") {
               const taskContent = await readFile(task, "utf8");
               await executeTask(agent, taskContent, output);
            } else if (!process.stdin.isTTY) {
               const stdinContent = await getStdin();
               await executeTask(agent, stdinContent, output);
            } else {
               // Interactive mode
               const rl = readline.createInterface({
                  input: process.stdin,
                  output: process.stdout
               });
               try {
                  console.log("\nPROMPT> ");
                  let lines = [];
                  let nlacc = 0;
                  for await (const l of rl) {
                     if (l.trim() === '') {
                        if (++nlacc == 2) {
                           lines.pop();
                           if (lines.length > 0) {
                              await executeTask(agent, lines.join("\n"), output);
                              lines = [];
                              nlacc = 0;
                              console.log("\nPROMPT> ");
                              continue;
                           } else break;
                        }
                     } else {
                        nlacc = 0;
                     }
                     lines.push(l);
                  }
               } finally {
                  rl.close();
               }
            }
         } catch (error) {
            agent.__STATUS(`Error executing task ${task}: ${error.message}`);
         }
      }
      if (output != process.stdout && !output.closed) output.end();
   } catch (error) {
      console.error(error);
      process.exit(1);
   } finally {
      if (LOGFILE) LOGFILE.end();
   }
}
