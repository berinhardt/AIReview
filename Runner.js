import "dotenv/config";
import { appendFile, readFile, writeFile } from "fs/promises";
import readline from 'readline/promises';
import { program } from 'commander';
import { LoadLLMModel } from './core/System.js';
import { Agent } from './core/Agent.js'
import { text } from "stream/consumers";
import { createWriteStream } from "fs";
import { finished } from "stream/promises";

program.version("0.2.0")
   .option('-p, --personality <personality>', 'AI personality file', null)
   .option('-t, --task <task>', 'Task file', '-')
   .option('-m, --model <model>', 'AI model to use', "Google.Gemini31FlashLite")
   .option('-o, --output <output>', 'Output file', '-')
   .action(main)
   .parse(process.argv);
async function readTask(task) {
   if (task && task != "-") return await readFile(task);
   else if (!process.stdin.isTTY) return await text(process.stdin);
   else {
      console.log("\n> ");
      const rl = readline.createInterface(process.stdin);
      const lines = [];
      let nlacc = 0;

      try {
         for await (const l of rl) {
            if (l.trim() === '') {
               if (++nlacc == 2) {
                  lines.pop()
                  break;
               }
            } else nlacc = 0;
            lines.push(l);
         }
      } finally {
         rl.close();
      }
      return lines.join("\n");
   }
}
async function executeTask(agent, task, output) {
   if (!task) return;

   const stream = agent.Task(task);
   stream.pipe(output);
   stream.on("end", () => {
      output.write(`\n\nUSD ${agent.cost}\n`);
   });
   return await finished(stream);
}
async function main(opts) {
   try {
      const output = opts.output == "-" ? process.stdout : createWriteStream(opts.output, { encoding: "utf8" });
      const model = await LoadLLMModel(opts.model);
      const personality = opts.personality ? await readFile(opts.personality) : await Agent.LoadDefaultPersonality('Default');
      const agent = new Agent(model, personality);
      const LOGFILE = createWriteStream("last.log", { encoding: "utf8" });
      agent.logger = (str) => { LOGFILE.write(`${str}\n`); }
      agent.status = (str) => console.log(str);

      if (opts.task && opts.task !== "-") {
         await executeTask(agent, await readFile(opts.task, "utf8"), output);
      } else if (!process.stdin.isTTY) {
         await executeTask(agent, await text(process.stdin), output);
      } else {
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
                        await executeTask(agent, lines.join("\n"), output)
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
         } catch (err) {
            throw err;
         } finally {
            rl.close();
         }
      }
   } catch (error) {
      console.error(error);
      process.exit(1);
   }
}
