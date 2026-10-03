// Spotting a plan the user hands over (an attached or named file laid out in
// phases), and telling whether the board has recorded it yet.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PHASE = /^[ \t]{0,3}(?:#{1,6}[ \t]*|[-*+][ \t]+)?(?:\*\*|__)?[ \t]*(?:phase|step|stage|milestone|שלב)[ \t]*\d+\b/gim;

/** Paths named in a prompt: @"…", @'…', @path, or a bare /abs or ~/ path to a text file. */
export function pathsIn(prompt) {
  const out = [];
  for (const m of prompt.matchAll(/@"([^"]+)"|@'([^']+)'|@(\S+)/g)) out.push(m[1] ?? m[2] ?? m[3]);
  for (const m of prompt.matchAll(/(?:^|\s)((?:~|\/)[^\s"'`]+\.(?:md|markdown|txt))\b/gi)) out.push(m[1]);
  return [...new Set(out.map((p) => p.replace(/[),.;:]+$/, "")))];
}

const resolve = (p, cwd) => path.resolve(cwd, p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : p);

/** The first named file that reads like a plan in phases: { path, phases }. */
export function handedPlan(prompt, cwd) {
  for (const p of pathsIn(String(prompt ?? ""))) {
    const file = resolve(p, cwd);
    try {
      const st = fs.statSync(file);
      if (!st.isFile() || st.size > 512_000) continue;
      const phases = new Set([...fs.readFileSync(file, "utf8").matchAll(PHASE)].map((m) => m[0].trim().toLowerCase().replace(/\W+/g, " ")));
      if (phases.size >= 2) return { path: file, phases: phases.size };
    } catch {
      /* not a file we can read */
    }
  }
  return null;
}

/** Whether the board has a plan note for it: one naming the file (a step plan may name just its file name),
 *  or one written since it was handed over. */
export function planRecorded(boardFile, plan) {
  if (!boardFile) return false;
  try {
    const board = JSON.parse(fs.readFileSync(boardFile, "utf8"));
    const root = path.dirname(path.dirname(boardFile));
    const rel = path.relative(root, plan.path);
    const tilde = plan.path.startsWith(os.homedir()) ? "~" + plan.path.slice(os.homedir().length) : plan.path;
    return (board.notes ?? []).some(
      (n) =>
        n.kind === "plan" &&
        (n.file === rel ||
          [plan.path, tilde].some((p) => (n.body ?? "").includes(p)) ||
          ((n.steps ?? []).length > 0 && (n.body ?? "").includes(path.basename(plan.path))) ||
          Date.parse(n.updatedAt) + 2000 >= plan.at),
    );
  } catch {
    return false;
  }
}
