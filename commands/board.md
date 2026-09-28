---
description: Open the Clipped board, or show its status
argument-hint: "[status|stop]"
allowed-tools: Bash(board *)
---

Argument: $ARGUMENTS

- No argument: run `board ui` to open the board in the browser. It returns at once — the board keeps running in the background — and prints the link; give the user that link in one line. If it fails, run `board context` and show the result instead.
- `stop`: run `board ui --stop`.
- `status`: run `board context` and show it as-is. Don't editorialize.
- Anything else: pass it through to `board` as a subcommand.

If there's no board here yet, say so in one line: one appears the first time something is worth keeping. Don't offer `board init`.
