import "dotenv/config";
import { readFile } from "fs/promises";
import readline from 'readline/promises';
import { program } from 'commander';
import { LoadLLMModel, ValidateFile } from './core/System.js';
import { Agent } from './core/Agent.js'
import { text } from "stream/consumers";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { CreateFile, DeleteFile, SearchReplaceFile, ReadFile, ListFiles } from "./tools/FileTools.js";
import { FileCommand } from "./commands/FileCommand.js";
import { RestartCommand } from "./commands/RestartCommand.js";
import { RoleCommand } from "./commands/RoleCommand.js";
import { CommandRegistry } from "./core/CommandRegistry.js";

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

    agent.addTools([
      CreateFile,
      DeleteFile,
      ReadFile,
      SearchReplaceFile,
      ListFiles]);
    agent.status = (str) => process.stderr.write(`[STATUS] ${str}\n`);
    agent.logger = (str) => LOGFILE.write(str);

    // Command Registry
    const registry = new CommandRegistry();
    const fileCommand = new FileCommand();
    registry.register(fileCommand);
    const restartCommand = new RestartCommand();
    registry.register(restartCommand);
    const roleCommand = new RoleCommand();
    registry.register(roleCommand);

    const output = opts.output == "-" ? process.stdout : createWriteStream(opts.output, { encoding: "utf8" });

    let rawTasks = opts.task.length === 0 ? ['-'] : opts.task;
    const tasks = [];
    for (const task of rawTasks) {
      if (task === "-") {
        tasks.push(task);
      } else if (task && task.trim() !== "") {
        const { valid, error } = await ValidateFile(task);
        if (valid) {
          tasks.push(task);
        } else {
          agent.__STATUS(`Skipping invalid task '${task}': ${error}`);
        }
      } else {
        agent.__STATUS(`Skipping empty task entry`);
      }
    }

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
              if (l.startsWith('@')) {
                try {
                  const result = await registry.execute(l, agent, lines);
                  agent.__STATUS(result);
                } catch (e) {
                  agent.__STATUS(`Command error: ${e.message}`);
                }
                continue;
              }
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
