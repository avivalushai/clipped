#!/usr/bin/env node
// PostToolUse (AskUserQuestion): when Claude asks with the multiple-choice widget,
// the question and the user's pick land in the Questions tab — decided, because
// the user chose. The options they didn't pick go with the answer, so "why this
// one?" has something to read later. A question left unanswered stays open.
//
// A design question — how something looks, reads or behaves — lands in the Design
// tab instead: a decision that is the user's call, with the options not taken as
// what was considered.
//
// tool_response looks like { questions: [...], answers: { "<question>": "<label>" } }.
import { board, safely } from "./lib.mjs";

const DESIGN = /\b(colou?rs?|shades?|palette|accent|theme|dark|light mode|fonts?|typeface|typography|type scale|spacing|padding|layout|grid|columns?|sidebar|header|footer|buttons?|icons?|style|look|visual|design|ui|ux|animations?|motion|wording|copy|labels?|headline|tabs?|pills?|dropdowns?|modal|drawer|empty state|density|rounded|shadows?)\b/i;
const isDesign = (q) => DESIGN.test([q?.header, q?.question].map(oneLine).join(" "));

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

    if (picked && isDesign(q)) {
      const chosen = (q.options ?? []).find((o) => oneLine(o?.label) === picked);
      const lost = (q.options ?? []).filter((o) => o !== chosen && oneLine(o?.label));
      const argv = [
        "note", "add", "decision", clip(`${text.replace(/\?$/, "")}: ${picked}`, 160),
        "--decided-by", "user",
        "--body", [chosen?.description ? `${picked} — ${oneLine(chosen.description)}` : picked, "Picked from the options Claude showed."].join(". "),
      ];
      if (lost.length)
        argv.push("--considered", lost.map((o) => (o.description ? `${oneLine(o.label)} — ${oneLine(o.description)}` : oneLine(o.label))).join(" · "));
      board(argv, cwd);
      if (key) board(["answer", key, picked, "--done", "--by", "user"], cwd); // asked before, left open: settled now
      continue;
    }

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
