#!/usr/bin/env node
// PostToolUse (Edit|Write|NotebookEdit): attach the edited file to the active card,
// and remember that code changed this turn so the Stop hook can check the board.
// A UI edit that brings in a new color, typeface or token is remembered too, so the
// Stop hook can ask for a design decision.
import path from "node:path";
import { addedText, designCalls, hasDesignDoc, isUiFile } from "./design.mjs";
import { board, findBoardFile, readState, safely, writeState } from "./lib.mjs";

safely(async (input) => {
  const cwd = input.cwd || process.cwd();
  const ti = input.tool_input || {};
  const files = [ti.file_path, ti.notebook_path, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e?.file_path) : [])]
    .filter((f) => typeof f === "string" && f);
  if (!files.length) return;

  const now = Date.now();
  writeState(input.session_id, { lastEditAt: now, lastEditFile: files[0] });

  const boardFile = findBoardFile(cwd);
  if (boardFile && files.some(isUiFile)) {
    const root = path.dirname(path.dirname(boardFile));
    const calls = designCalls(addedText(ti), root);
    if (calls.length) {
      const prev = readState(input.session_id).designCalls ?? [];
      writeState(input.session_id, { designEditAt: now, designCalls: [...new Set([...prev, ...calls])].slice(0, 12), designDoc: hasDesignDoc(root) });
    }
  }
  board(["touch", ...new Set(files)], cwd); // silent no-op when there's no board or no active card
});
