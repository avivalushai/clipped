#!/usr/bin/env node
// Stop: two chances to catch what the board missed, each at most once per turn.
//
//   1. Code changed this turn and no card moved.
//   2. The reply itself says something was left behind — a step for the user,
//      something not done, a decision, a suggestion — and the board didn't
//      change this turn. Those leave no diff, so only the words give them away.
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

/* What a reply says when it leaves something behind. Kept narrow on purpose:
   a nudge on every turn would be noise, and noise gets ignored. */
const LEFT_BEHIND = [
  ["a step only the user can do", /\byou(?:'ll| will|'d| would)? (?:still )?(?:need|have) to\b|\bremember to\b|\bdon'?t forget\b|\bon your (?:side|end)\b/i],
  ["something not done", /(?:\bnot|n'?t)\s+(?:been\s+)?(?:yet\s+)?(?:committed|pushed|deployed|tested|verified|fixed|done|wired|handled)\b|\bI (?:didn'?t|couldn'?t|did not|could not) (?:check|test|verify|fix|finish|get to|confirm)\b|\bleft (?:it |them |that )?(?:out|alone|untouched|for later)\b|\bTODO\b|\bstill (?:needs|missing|broken|open|to do)\b/i],
  ["a decision", /\b(?:we|you) (?:decided|agreed|settled on|went with|chose)\b|\bdecided to\b|\bgoing with\b/i],
  ["a suggestion", /\bI(?:'d| would) (?:suggest|recommend)\b|\bmy (?:pick|recommendation)\b|\bworth (?:adding|doing|building) (?:later|next)\b|\bfor later\b|\bfollow[- ]up\b/i],
];

function leftBehind(text) {
  if (!text) return [];
  if (/^\s*Board: /m.test(text)) return []; // the footer means the board was dealt with
  return LEFT_BEHIND.filter(([, re]) => re.test(text)).map(([what]) => what);
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
  const now = Date.now();
  const turnStart = state.lastStopAt ?? now - 10 * 60_000;
  const turn = String(input.prompt_id ?? input.turn_number ?? "");
  const changed = lastBoardChange(boardFile);
  writeState(input.session_id, { lastStopAt: now });

  // 1. Code changed and the board didn't. Not the file's mtime: `board touch` rewrites
  //    board.json on every new file, which would look like an update. Only a log entry
  //    means a card actually moved.
  const { lastEditAt, blockedFor } = state;
  if (lastEditAt && blockedFor !== lastEditAt && changed + 1000 < lastEditAt) {
    writeState(input.session_id, { blockedFor: lastEditAt, lastStopAt: now, textBlockedFor: turn || now });
    block(
      "Code changed but the Clipped board didn't. Update it before finishing: move the card you worked on (`board update|park|review|done`), or add one if this was new work. If nothing worth recording changed, say so in one line and stop. Follow the clipped skill, and end with the one-line Board: footer.",
    );
  }

  // 2. The reply left something behind and the board didn't move this turn.
  if (turn && state.textBlockedFor === turn) return; // once per turn
  // Without a turn id, the reply to a nudge would look like a new turn — so a second
  // nudge within two minutes of the last one never happens.
  if (state.textBlockedAt && now - state.textBlockedAt < 120_000) return;
  if (changed >= turnStart) return;
  const found = leftBehind(input.last_assistant_message);
  if (!found.length) return;
  writeState(input.session_id, { textBlockedFor: turn || now, textBlockedAt: now, lastStopAt: now });
  block(
    `Your reply mentions ${found.join(", ")}, and the Clipped board didn't change this turn. Run the "Before you end a turn" check from the clipped skill: record what's left (a card, an idea, a chore in the user's turn, a brainstorm or reference note). If nothing there is worth a row, say so in one line and stop. End with the one-line Board: footer if the board changed.`,
  );
});
