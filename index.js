import "dotenv/config";
import readline from 'readline/promises';
import path from 'path';
import { program } from 'commander';
import { LoadLLMModel, ValidateFile, Dirname } from './core/System.js';
import { Agent } from './core/Agent.js'
import { text } from "stream/consumers";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { CreateFile, DeleteFile, ModifyFile, ReadFile, ListFiles } from "./tools/FileTools.js";
import { GitStatus, GitDiffFile } from "./tools/GitTools.js";
import { ReviewResult } from "./tools/ReviewTools.js";
import { FileCommand } from "./commands/FileCommand.js";
import { ResetCommand } from "./commands/ResetCommand.js";
import { RoleCommand } from "./commands/RoleCommand.js";
import { TaskCommand } from "./commands/TaskCommand.js";
import { DevLoopCommand } from "./commands/DevLoopCommand.js";
import { CommandRegistry } from "./core/CommandRegistry.js";
import { OutputHandler } from "./core/OutputHandler.js";
import { GeminiNoWarn } from "./models/Google.js";

program.version("0.2.0")
  .option('-p, --personality <personality>', 'AI personality file', null)
  .option('-m, --model <model>', 'AI model name', "Google.Gemini31FlashLite")
  .option('-n, --notes-dir <dir>', 'Notes directory', "notes")
  .option('-d, --target-dir <dir>', 'Target directory', null)
  .option('-t, --task <task>', 'Task file', (val, memo) => [...memo, val], ["-"])
  .option('-o, --output <output>', 'Output file', '-')
  .option('-l, --logfile <logfile>', 'Agent log file', 'last.log')
  .option('-r, --rpm-limit <rpm>', 'Max requests per minute', 0)
  .action(main)
  .parse(process.argv);
GeminiNoWarn();
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
    if (opts.rpmLimit) model.RPM_LIMIT = opts.rpmLimit;
    const agent = new Agent(model, opts.chroot);
    if (opts.personality) {
      await agent.setPersonality(opts.personality);
    } else {
      const defaultPersonalityPath = path.join(Dirname(import.meta.url), "prompts", "Default.md");
      await agent.setPersonality(defaultPersonalityPath);
    }

    agent.addTools([
      CreateFile,
      DeleteFile,
      ReadFile,
      ModifyFile,
      ListFiles,
      GitStatus,
      GitDiffFile,
      ReviewResult]);
    agent.logger.pipe(LOGFILE);

    // Command Registry
    const registry = new CommandRegistry();
    registry.register(new FileCommand());
    registry.register(new ResetCommand());
    registry.register(new RoleCommand());
    registry.register(new TaskCommand());
    registry.register(new DevLoopCommand());

    let output = new OutputHandler(opts.output === '-' ? process.stdout : createWriteStream(opts.output, { encoding: "utf8" }));
    agent.signal.on('status', (str) => output.setStatus(str));

    let cachedStdin = null;
    const getStdin = async () => {
      if (cachedStdin === null) {
        cachedStdin = await text(process.stdin);
      }
      return cachedStdin;
    };
    const tasks = opts.task;
    for (const task of tasks) {
      try {
        if (task !== "-") {
          const { valid, error } = await ValidateFile(task);
          if (valid) {
            const taskContent = await readFile(task, "utf8");
            await executeTask(agent, taskContent, output);
          } else {
            agent.Status(`Invalid task ${task}`);
          }
        } else if (!process.stdin.isTTY) {
          const stdinContent = await getStdin();
          await executeTask(agent, stdinContent, output);
        } else {
          // Interactive mode
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const updatePrompt = () => {
            rl.setPrompt(`${agent.getPersonalityName()}> `);
          };

          updatePrompt();
          rl.prompt();

          try {
            let lines = [];
            output.showStatusBar(false);
            for await (const l of rl) {
              if (l.startsWith('@')) {
                try {
                  const config = { agent, promptBuffer: lines, outputStream: output };
                  const result = await registry.execute(l, config);
                  agent.Status(result);
                  console.error(result);
                  updatePrompt();
                } catch (e) {
                  agent.Status(`Command error: ${e.message}`);
                  console.error(`Command error: ${e.message}`);
                }
                rl.prompt();
                continue;
              } else if (l.trim() === '') {
                if (lines.length > 0) {
                  output.showStatusBar(true);
                  await executeTask(agent, lines.join("\n"), output);
                  output.showStatusBar(false);
                  lines = [];
                  rl.prompt();
                  continue;
                } else {
                  output.showStatusBar(true);
                  break;
                }
              }
              lines.push(l);
            }
          } finally {
            rl.close();
          }
        }
      } catch (error) {
        agent.Status(`Error executing task ${task}: ${error.message}`);
      }
    }
    output.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    if (LOGFILE) LOGFILE.end();
  }
}
