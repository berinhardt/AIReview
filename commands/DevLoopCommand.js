import { Command } from './Command.js';
import { readFile, access } from 'fs/promises';
import path from 'path';
import { Dirname, SanitizePath } from '../core/System.js';
import readline from 'readline/promises';
import { pipeline } from 'stream/promises';

export class DevLoopCommand extends Command {
    constructor() {
        super('DEVLOOP');
        this.META = {
            name: 'DEVLOOP',
            arguments: [{ name: 'featureFile', type: 'string' }]
        };
    }

    async execute(args, config) {
        const { featureFile } = args;
        const { agent, statusBar, outputStream } = config;
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
            await agent.setPersonality(personality, true);
            const stream = agent.Task(taskContent, 0, outputStream);
            await new Promise((resolve, reject) => {
                stream.on('end', resolve);
                stream.on('error', reject);
            });
        };

        statusBar?.enable();
        try {
            while (iteration <= MAX_LOOP_ITERATIONS) {
                agent.Status(`Iteration ${iteration}/${MAX_LOOP_ITERATIONS}`);

                // 1. Coder
                agent.Status("--- Coder ---");
                agent.restart();
                let coderTask = await readFile(absoluteFeatureFile, 'utf8');
                
                if (iteration > 1) {
                    // Add Review.md (mandatory) and Improvements.md (optional) if they exist in chroot
                    const chroot = agent.tools.ENV.cwd;
                    
                    // Check Review.md
                    try {
                        const reviewPath = path.join(chroot, 'Review.md');
                        await access(reviewPath);
                        const review = await readFile(reviewPath, 'utf8');
                        coderTask += `\n\nReview:\n${review}`;
                    } catch (e) {
                        return "Error: Review.md not found in chroot.";
                    }

                    // Check Improvements.md
                    try {
                        const improvementsPath = path.join(chroot, 'Improvements.md');
                        await access(improvementsPath);
                        const improvements = await readFile(improvementsPath, 'utf8');
                        coderTask += `\n\nImprovements:\n${improvements}`;
                    } catch (e) {
                        // Optional, ignore
                    }
                }
                
                await runTask(coderPersonality, coderTask);

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
                    const answer = await rl.question("Loop limit reached. Continue? [y/n] ");
                    rl.close();
                    if (answer.toLowerCase() === 'y') {
                        iteration = 1;
                    } else {
                        return "DevLoop aborted by user.";
                    }
                }
            }
            return "DevLoop finished.";
        } finally {
            statusBar?.disable();
        }
    }
}
