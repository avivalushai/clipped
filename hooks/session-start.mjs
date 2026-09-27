#!/usr/bin/env node
// SessionStart: tell Claude what's open, parked and in review before it starts.
import { BOARD_BIN, board, emit, safely } from "./lib.mjs";

safely(async (input) => {
  const cwd = input.cwd || process.cwd();
  const out = board(["context"], cwd);
  if (!out) return;

  const hasBoard = !out.startsWith("Clipped: no board");
  const additionalContext = hasBoard
    ? [
        out,
        "",
        `Keep this board up to date as you work — see the clipped skill. Write to it with \`board\` (on PATH) or \`node ${BOARD_BIN}\`.`,
      ].join("\n")
    : "This project has no Clipped board yet. Don't offer to create one: the first `board add`, `board ask` or `board note add` makes it. Follow the clipped skill as usual — when something is worth keeping, record it and the board appears.";

  emit({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } });
});
