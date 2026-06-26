## CONTEXT FILES

- **Project Structure:** See `Files.md` for the current codebase layout
- **Code Review:** See `Review.md` for the list of issues that needs to be addressed
- **Design Guidelines:** See `Design.md` for strict design constraints and guidelines

## TOOLS

- You can read files using the `ReadFile` function

## YOUR TASKS

1. **INITIALIZATION (MANDATORY):** Before analyzing any issues, you MUST use the `ReadFile` tool to read `Design.md`. You cannot accurately evaluate the review without understanding the architectural constraints and guidelines contained in this file.
2. **Analyze, Verify, and Categorize:** Review each issue listed in `Review.md` and assign it a severity category: `[CRITICAL, IMPORTANT, NORMAL, TRIVIAL, INVALID]`.
   - **MANDATORY VERIFICATION:** Do not blindly trust the review diff. You must use the `ReadFile` tool to aggressively cross-reference the codebase.
   - **TRACE DEPENDENCIES:** **ALWAYS** read the offending file **AND** any related files. If an issue claims a method, variable, or class is missing (e.g., an undefined method call), you must read the file where that entity is imported from or defined (e.g., base classes, imported modules) to verify if it actually exists.
   - **INVALIDATE:** Categorize as `INVALID` any issues containing lies, hallucinations, mistakes discovered during your file reads, OR anything that contradicts the design rules you read in `Design.md`.
3. **Identify Ambiguities:** For each issue, identify any doubts, missing context, or ambiguities that arise from the planning phase before code can be written. Cross-reference these with `Design.md` to ensure your doubts aren't already answered there.
4. **Generate Task Prompts:** For each valid issue, generate a dedicated markdown file containing the task description for the coding agent.

- Do not write or modify any codebase code yourself. You are only generating the task instructions.
- Create a file named `issues/Prompt-[Category]-Issue[X].md` with the generated prompt
- Read the file and check the previous steps once more. If the issue becomes INVALID remove the file

1. **Output Summary:** Provide a final summary list of all the ambiguities and doubts you identified across all issues. Explicitly list every file you read to verify each issue (this list must include `Design.md`).

## REQUIREMENTS FOR EACH PROMPT `issues/Prompt-[Category]-Issue[X].md`

Every generated prompt must include the following instructions for the coding agent:

- **Context Requirement:** Explicitly tell the agent to refer to `Files.md` to understand project structure before starting and to read `Design.md` for design constraints.
- **Reasoning Requirement:** Instruct the agent to explain its reasoning and approach before writing or modifying code.
- **Issue Specifics:** Detail the exact issue to be fixed.
- **Clarifications List:** Include the specific list of ambiguities/doubts you identified for this particular issue (so the coding agent knows what it needs to figure out or assume).
- **Global Project Constraints:** Include these exact constraints in every prompt:
  - Changes can be made to any of the files defined in `Files.md`, and new files can be created if necessary.
  - Do not add new external dependencies unless strictly necessary. If you must, explicitly justify the reason in your output.
  - The `project/core/System.js` file contains minor utilities; you may add more utilities to it if needed for the fix.
  - Prioritize code correctness over performance optimization for this iteration.
  - You must use the `SearchReplaceFile` tool to apply edits to the files.
