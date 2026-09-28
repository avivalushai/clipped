#!/usr/bin/env node
// Stop: code changed this turn and no card moved → ask Claude to update the board,
// at most once per turn. Each nudge costs a whole extra pass over the conversation,
// so the rest — decisions, loose ends, steps for the user — is left to the skill's
// "Before you end a turn" check instead of a second nudge read from the reply.
//
// Blocking uses exit code 2 with the reason on stderr: the documented way for a
// Stop hook to keep Claude going, whatever the JSON output shape of the day.
import fs from "node:fs";
import { findBoardFile, readState, safely, writeState } from "./lib.mjs";

/** The last time anything on the board moved: a card's log, or a note. */
function lastBoardChange(boardFile) {
  const board = JSON.parse(fs.readFileSync(boardFile, "utf8"));
  const times = [
    ...(board.features ?? []).flatMap((f) => (f.log ?? []).map((e) => Date.parse(e.at))),
    ...(board.notes ?? []).map((n) => Date.parse(n.updatedAt)),
  ].filter(Number.isFinite);
  return times.length ? Math.max(...times) : 0;
}

function block(reason) {
  process.stderr.write(reason);
  process.exit(2);
}

safely(async (input) => {
  if (input.stop_hook_active) return; // never loop, where the host says so

  const cwd = input.cwd || process.cwd();
  const boardFile = findBoardFile(cwd);
  if (!boardFile) return;

  const state = readState(input.session_id);
  const turn = String(input.prompt_id ?? input.turn_number ?? "");
  if (turn && state.nudgedFor === turn) return; // one nudge per turn

  // Not the file's mtime: `board touch` rewrites board.json on every new file, which
  // would look like an update. Only a log entry means a card actually moved.
  const { lastEditAt, blockedFor } = state;
  if (!lastEditAt || blockedFor === lastEditAt) return; // never twice for the same edit
  if (lastBoardChange(boardFile) + 1000 >= lastEditAt) return;

  writeState(input.session_id, { blockedFor: lastEditAt, nudgedFor: turn || null });
  block(
    "Code changed but the Clipped board didn't. Update it before finishing: move the card you worked on (`board update|park|review|done`), or add one if this was new work. If nothing worth recording changed, say so in one line and stop. Follow the clipped skill, and end with the one-line Board: footer.",
  );
});
