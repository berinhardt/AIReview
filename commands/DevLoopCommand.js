import { Command } from './Command.js';
import { readFile, access } from 'fs/promises';
import path from 'path';
import { Dirname, runGitCommand, SanitizePath } from '../core/System.js';
import readline from 'readline/promises';
import { pipeline } from 'stream/promises';

/**
 * Command to run a development loop.
 * @extends Command
 */
export class DevLoopCommand extends Command {
   /**
    * @property {CommandMeta} META
    */
   constructor() {
      super('DEVLOOP');
      this.META = {
         name: 'DEVLOOP',
         description: 'Runs a development loop with a coder and reviewer.',
         arguments: [{ name: 'featureFile', type: 'string', description: 'The path to the feature file.' }]
      };
   }

   /**
    * Executes the development loop.
    * @description Runs a loop of coder and reviewer tasks until the review is accepted or the loop limit is reached.
    * @param {Object} args - The arguments for the command.
    * @param {string} args.featureFile - The path to the feature file.
    * @param {Object} config - The configuration object.
    * @param {Object} config.agent - The agent instance.
    * @param {Object} config.outputStream - The output stream handler.
    * @returns {Promise<string>} The result of the command execution.
    * @throws {Error} If an error occurs during execution.
    */
   async execute(args, config) {
      const { featureFile } = args;
      const { agent, outputStream } = config;
      if (!featureFile) {
         return "Error: Missing <Feature-File> argument.";
      }

      const MAX_LOOP_ITERATIONS = 5;
      let iteration = 1;

      const coderPersonality = path.join(Dirname(import.meta.url), '..', 'prompts', 'Coder.md');
      const reviewerPersonality = path.join(Dirname(import.meta.url), '..', 'prompts', 'Reviewer.md');

      // Resolve feature file relative to process.cwd()
      const absoluteFeatureFile = path.resolve(process.cwd(), featureFile);

      // Check if feature file exists
      try {
         await access(absoluteFeatureFile);
      } catch (e) {
         return `Error: Feature file not found at ${absoluteFeatureFile}`;
      }

      const runTask = async (personality, taskContent) => {
         await agent.setPersonality(personality);
         const stream = agent.Task(taskContent);
         await pipeline(stream, outputStream, { end: false });
      };

      outputStream.showStatusBar(true);
      try {
         const target = agent.tools.ENV.targetDir;
         const sandbox = agent.tools.ENV.notesDir;
         agent.notes.reviewAccepted = false;
         while (iteration <= MAX_LOOP_ITERATIONS) {
            agent.Status(`Iteration ${iteration}/${MAX_LOOP_ITERATIONS}`);

            // 1. Coder
            agent.Status("--- Coder ---");
            agent.restart();
            let coderTask = await readFile(absoluteFeatureFile, 'utf8');

            // Add Review.md (mandatory) and Improvements.md (optional) if they exist in sandbox 

            // Check Review.md
            try {
               const reviewPath = path.join(sandbox, 'Review.md');
               await access(reviewPath);
               const review = await readFile(reviewPath, 'utf8');
               coderTask += `\n\nReview:\n${review}`;
            } catch (e) {
               if (iteration > 0)
                  return "Error: Review.md not found in sandbox.";
            }

            // Check Improvements.md
            try {
               const improvementsPath = path.join(sandbox, 'Improvements.md');
               await access(improvementsPath);
               const improvements = await readFile(improvementsPath, 'utf8');
               coderTask += `\n\nImprovements:\n${improvements}`;
            } catch (e) {
               // Optional, ignore
            }
            await runTask(coderPersonality, coderTask);
            runGitCommand(['add', '*'], target);
            // 2. Reviewer
            agent.Status("--- Reviewer ---");
            agent.restart();
            const reviewerTask = await readFile(absoluteFeatureFile, 'utf8');
            await runTask(reviewerPersonality, reviewerTask);

            if (agent.notes.reviewAccepted) {
               return "DevLoop completed successfully.";
            }

            iteration++;

            if (iteration > MAX_LOOP_ITERATIONS) {
               const rl = readline.createInterface({
                  input: process.stdin,
                  output: process.stdout
               });
               outputStream.showStatusBar(false);
               const answer = await rl.question("Loop limit reached. Continue? [y/n] ");
               rl.close();
               if (answer.toLowerCase() === 'y') {
                  iteration = 1;
                  outputStream.showStatusBar(true);
               } else {
                  return "DevLoop aborted by user.";
               }
            }
         }
         return "DevLoop finished.";
      } catch (error) {
         console.error(error);
         throw error;
      } finally {
         outputStream.showStatusBar(false);
      }
   }
}
