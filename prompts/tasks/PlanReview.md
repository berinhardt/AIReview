## CONTEXT FILES
- **Project Structure:** See `Files.md` for the current codebase layout
- **Code Review:** See `Review.md` for the list of issues that needs to be addressed

## YOUR TASKS
1. **Analyze and Categorize:** Review each issue listed in `Review.md` and assign it a severity category: `[CRITICAL, IMPORTANT, NORMAL, LOW, TRIVIAL]`.
2. **Identify Ambiguities:** For each issue, identify any doubts, missing context, or ambiguities that arise from the planning phase before code can be written.
3. **Generate Task Prompts:** For each issue, generate a dedicated markdown file containing the task description for the coding agent.
  - Do not write or modify any codebase code yourself. You are only generating the task instructions.
  - Create a file named `Prompt-[Category]-Issue[X].md` with the generated prompt
4. **Output Summary:** Provide a final summary list of all the ambiguities and doubts you identified across all issues.

## REQUIREMENTS FOR EACH PROMPT `Prompt-[Category]-Issue[X].md`
Every generated prompt must include the following instructions for the coding agent:
- **Context Requirement:** Explicitly tell the agent to refer to Files.md to understand project structure before starting
- **Reasoning Requirement:** Instruct the agent to explain its reasoning and approach before writing or modifying code.
- **Issue Specifics:** Detail the exact issue to be fixed.
- **Clarifications List:** Include the specific list of ambiguities/doubts you identified for this particular issue (so the coding agent knows what it needs to figure out or assume).
- **Global Project Constraints:** Include these exact constraints in every prompt:
  - Changes can be made to any of the files defined in `Files.md`, and new files can be created if necessary.
  - Do not add new external dependencies unless strictly necessary. If you must, explicitly justify the reason in your output.
  - The `project/core/System.js` file contains minor utilities; you may add more utilities to it if needed for the fix.
  - Prioritize code correctness over performance optimization for this iteration.
  - You must use the `SearchReplaceFile` tool to apply edits to the files.

