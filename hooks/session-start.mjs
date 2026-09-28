#!/usr/bin/env node
// SessionStart: tell Claude what's open, parked and in review before it starts.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BOARD_BIN, board, emit, safely } from "./lib.mjs";

/** The board's address on this machine: 4747 unless another app had it (then `board ui` saved the port). */
function boardLink() {
  let port = 4747;
  try {
    const home = process.env.CLIPPED_HOME || path.join(os.homedir(), ".clipped");
    const saved = JSON.parse(fs.readFileSync(path.join(home, "settings.json"), "utf8")).port;
    if (Number.isInteger(saved) && saved > 0) port = saved;
  } catch {
    /* no settings yet */
  }
  return `http://clipped.localhost:${port}`;
}

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
        `The board opens at ${boardLink()} (\`board ui\` starts it if it isn't running). Give the user that link when they ask where the board is.`,
      ].join("\n")
    : "This project has no Clipped board yet. Don't offer to create one: the first `board add`, `board ask` or `board note add` makes it. Follow the clipped skill as usual — when something is worth keeping, record it and the board appears.";

  emit({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext } });
});
