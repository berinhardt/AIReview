## PROJECT STRUCTURE
The project files are listed on Files.md.

## REQUEST
There is a Code Review on the Review.md file.
For each issue I want you to check that it is real, and if so, create a file called Prompt-IssueX.md with a task description for a coding agent to fix it.
Do not modify or write code yet.
The output of this prompt should be a list of ambiguities or doubts arised from the planning.
Remember to tell the Prompts about Files.md and ask to explain the reasoning in the output
On each prompt, add the list of things that need clarification about the issue.

## Clarifications
1.  The changes can be on any of the files defined in Files.md, you can even create new files if needed.
2.  I'd prefer if you didn't added dependencies, but if you must so explain your reasons on the output
3.  project/core/System.js has some minor utilities, you can add more if need be
4.  for now we are pursuing correctness over performance
5.  tell the agent to use the SearchReplaceFile tool to edit files

