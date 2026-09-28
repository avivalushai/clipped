#!/usr/bin/env node
// PostToolUse (AskUserQuestion): when Claude asks with the multiple-choice widget,
// the question and the user's pick land in the Questions tab — decided, because
// the user chose. The options they didn't pick go with the answer, so "why this
// one?" has something to read later. A question left unanswered stays open.
//
// tool_response looks like { questions: [...], answers: { "<question>": "<label>" } }.
import { board, safely } from "./lib.mjs";

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const oneLine = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

safely(async (input) => {
  if (input.tool_name && input.tool_name !== "AskUserQuestion") return;
  const cwd = input.cwd || process.cwd();
  const questions = input.tool_input?.questions ?? input.tool_response?.questions ?? [];
  const answers = input.tool_response?.answers ?? {};
  if (!Array.isArray(questions) || !questions.length) return;

  // What's already on the board, so asking twice updates one card.
  let known = [];
  try {
    known = JSON.parse(board(["list", "--type", "question", "--all", "--json"], cwd) || "[]");
  } catch {
    known = [];
  }

  for (const q of questions) {
    const text = oneLine(q?.question);
    if (!text) continue;
    const title = clip(text, 160);
    const picked = oneLine(answers[q.question] ?? answers[text] ?? "");
    const labels = (q.options ?? []).map((o) => oneLine(o?.label)).filter(Boolean);

    let key = known.find((f) => f.title === title)?.key;
    if (!key) {
      const card = board(["ask", title, "--json"], cwd);
      if (!card) continue; // no board allowed here (home folder, dot-folder): say nothing
      try {
        key = JSON.parse(card).key;
      } catch {
        continue;
      }
    }
    if (!picked) continue; // skipped: it stays open

    const chosen = (q.options ?? []).find((o) => oneLine(o?.label) === picked);
    const others = labels.filter((l) => l !== picked);
    const answer = [
      chosen?.description ? `${picked} — ${oneLine(chosen.description)}` : picked,
      chosen || !labels.length ? "" : "(their own answer)",
      others.length ? `Other options: ${others.join(" · ")}` : "",
    ].filter(Boolean).join(". ");
    board(["answer", key, answer, "--done", "--by", "user"], cwd);
  }
});
