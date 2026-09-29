#!/usr/bin/env node
// Turn docs/decisions.md into decision notes on the board, through the board CLI.
//   node scripts/import-decisions.mjs [docs/decisions.md]          # dry run: prints the commands
//   node scripts/import-decisions.mjs [docs/decisions.md] --apply  # runs them
//   --areas design,ux,copy   which areas go to the board's Design tab (the default); --areas all for every one
// Needs a board CLI that knows decisions (schema v5). Skips titles already on the board.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const areasArg = args.find((a) => a.startsWith("--areas="))?.slice(8) ?? (args.includes("--areas") ? args[args.indexOf("--areas") + 1] : "design,ux,copy");
const areas = areasArg === "all" ? null : new Set(areasArg.split(",").map((a) => a.trim().toLowerCase()));
const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--areas") ?? "docs/decisions.md";
const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "board.cjs");
const board = (argv) => execFileSync(process.execPath, [bin, ...argv], { encoding: "utf8" });

const text = fs.readFileSync(file, "utf8");
const decisions = text
  .split(/^### /m)
  .slice(1)
  .map((chunk) => {
    const [head, ...rest] = chunk.split("\n");
    const m = /^D-\d+\s+(.*)$/.exec(head.trim());
    if (!m) return null;
    const field = (name) => {
      const line = rest.find((l) => l.startsWith(`- ${name}:`));
      return line ? line.slice(`- ${name}:`.length).trim() : "";
    };
    return {
      title: m[1].trim(),
      area: field("Area"),
      date: field("Date"),
      decidedBy: field("Decided by").toLowerCase().startsWith("user") ? "user" : "claude",
      chose: field("Chose"),
      why: field("Why"),
      considered: field("Considered"),
      cards: (field("Cards").match(/[A-Z][A-Z0-9]*-\d+/g) ?? []),
      evidence: field("Evidence"),
    };
  })
  .filter(Boolean)
  .filter((d) => !areas || areas.has(d.area.toLowerCase()));

const onBoard = new Set(JSON.parse(board(["note", "list", "--kind", "decision", "--json"])).map((n) => n.title));
const cardsOnBoard = new Set(JSON.parse(board(["list", "--all", "--json"])).map((f) => f.key));

let added = 0;
for (const d of decisions) {
  if (onBoard.has(d.title)) continue;
  const body = [
    d.chose && `Chose: ${d.chose}`,
    d.why && `Why: ${d.why}`,
    [d.area && `Area: ${d.area}`, d.date && `Decided: ${d.date}`].filter(Boolean).join(" · "),
    d.evidence && `Evidence: ${d.evidence}`,
  ]
    .filter(Boolean)
    .join("\n");
  const argv = ["note", "add", "decision", d.title, "--body", body, "--decided-by", d.decidedBy, "--by", "claude"];
  if (d.considered && !/^not recorded/i.test(d.considered)) argv.push("--considered", d.considered);
  for (const c of d.cards) if (cardsOnBoard.has(c)) argv.push("--card", c);
  if (apply) board(argv);
  else console.log(`board ${argv.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`);
  added++;
}
console.log(`${apply ? "Added" : "Would add"} ${added} of ${decisions.length} decisions (${decisions.length - added} already on the board).`);
