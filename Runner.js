import { StatusBar } from './core/StatusBar.js';
import "dotenv/config";
import { readFile } from "fs/promises";
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

class SafeStdout extends Transform {
  constructor(statusBar) {
    super();
    this.statusBar = statusBar;
  }

  _transform(chunk, encoding, callback) {
    process.stdout.write(chunk);
    if (this.statusBar && this.statusBar.enabled) {
      this.statusBar.render();
    }
    callback();
  }
}

async function main(opts) {
  let LOGFILE;
  try {
    LOGFILE = createWriteStream(opts.logfile);
    const model = await LoadLLMModel(opts.model);
    const agent = new Agent(model, opts.chroot);
    if (opts.personality) {
      await agent.setPersonality(opts.personality, true);
    } else {
      const defaultPersonalityPath = path.join(Dirname(import.meta.url), "prompts", "Default.md");
      await agent.setPersonality(defaultPersonalityPath, true);
    }

    agent.addTools([
      CreateFile,
      DeleteFile,
      ReadFile,
      ModifyFile,
      ListFiles]);
    agent.logger.pipe(LOGFILE);

    let statusBar = null;
    if (opts.output === '-' && process.stdout.isTTY) {
      statusBar = new StatusBar();
      statusBar.enable();
      agent.signal.on('status', (str) => statusBar.update(str));
    } else {
      agent.signal.on('status', (str) => process.stderr.write(`[STATUS] ${str}\n`));
    }

    // Command Registry
    const registry = new CommandRegistry();
    const fileCommand = new FileCommand();
    registry.register(fileCommand);
    const restartCommand = new RestartCommand();
    registry.register(restartCommand);
    const roleCommand = new RoleCommand();
    registry.register(roleCommand);

    let output;
    if (opts.output === '-') {
      if (statusBar) {
        output = new SafeStdout(statusBar);
      } else {
        output = process.stdout;
      }
    } else {
      output = createWriteStream(opts.output, { encoding: "utf8" });
    }

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
          agent.Status(`Skipping invalid task '${task}': ${error}`);
        }
      } else {
        agent.Status(`Skipping empty task entry`);
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
          if (statusBar) statusBar.disable();
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
            for await (const l of rl) {
              if (l.startsWith('@')) {
                try {
                  const result = await registry.execute(l, agent, lines);
                  agent.Status(result);
                  updatePrompt();
                } catch (e) {
                  agent.Status(`Command error: ${e.message}`);
                }
                rl.prompt();
                continue;
              }
              if (l.trim() === '') {
                lines.pop();
                if (lines.length > 0) {
                  await executeTask(agent, lines.join("\n"), output);
                  lines = [];
                  rl.prompt();
                  continue;
                } else break;
              }
              lines.push(l);
            }
          } finally {
            rl.close();
            if (statusBar) statusBar.enable();
          }
        }
      } catch (error) {
        agent.Status(`Error executing task ${task}: ${error.message}`);
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
