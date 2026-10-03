// Pure helpers over a Board's notes: lookup, formatting, ordering.
// Notes are the tabs that aren't work — brainstorms, plans, decisions, references.

import { type Ctx, UserError, nowIso } from "./context.js";
import { ageLabel } from "./features.js";
import type { Actor, Board, Note, NoteKind } from "./schema.js";

export const KIND_ORDER: NoteKind[] = ["brainstorm", "plan", "decision", "reference"];

/** A plan made in chat: it holds its own steps. A plan without steps is a document. */
export const isStepPlan = (n: Note): boolean => n.kind === "plan" && n.steps.length > 0;

/** How far a step plan has got. A step is done once it's ticked, or once the card
 *  doing it is done. A step whose card waits for your review is behind us too: the
 *  plan has moved on to the next step, it just isn't done until you've checked it. */
export function planProgress(b: Board, n: Note): { done: number; total: number; next: number; toReview: number } {
  const status = new Map(b.features.map((f) => [f.key, f.status]));
  const isDone = n.steps.map((s) => s.done || (!!s.card && status.get(s.card) === "done"));
  const inReview = n.steps.map((s, i) => !isDone[i] && !!s.card && status.get(s.card) === "review");
  const next = n.steps.findIndex((_, i) => !isDone[i] && !inReview[i]);
  return { done: isDone.filter(Boolean).length, total: n.steps.length, next, toReview: inReview.filter(Boolean).length };
}

/** "step 3 of 5", "step 7 of 7 · 6 to review" — or "all 5 steps done". */
export function planLabel(b: Board, n: Note): string {
  const { done, total, next, toReview } = planProgress(b, n);
  if (done === total) return `all ${total} steps done`;
  const review = toReview ? `${toReview} to review` : "";
  if (next === -1) return `all ${total} steps built, ${review}`;
  return [`step ${next + 1} of ${total}`, review].filter(Boolean).join(" · ");
}

/** A call Claude made that you haven't agreed with yet. */
export const uncheckedDecision = (n: Note): boolean => n.kind === "decision" && n.decidedBy === "claude" && !n.confirmedAt;

/** Who made a decision's call, and whether you've seen it. */
export function decidedLabel(n: Note): string {
  if (n.kind !== "decision") return "";
  if (n.decidedBy === "user") return "your call";
  return n.confirmedAt ? "Claude's call, you agreed" : "Claude's call, unchecked";
}

/** Accepts LE-N3, N3 or 3 — `board note` commands only ever mean a note. */
export function findNote(board: Board, input: string): Note {
  const raw = input.trim().toUpperCase();
  const want = /^\d+$/.test(raw)
    ? `${board.project.key}-N${raw}`
    : /^N\d+$/.test(raw)
      ? `${board.project.key}-${raw}`
      : raw;
  const n = board.notes.find((x) => x.id === want);
  if (!n) throw new UserError(`no note ${want}`);
  return n;
}

export function stampNote(ctx: Ctx, n: Note, by: Actor): void {
  n.updatedAt = nowIso(ctx);
  n.updatedBy = by;
}

/** Where a note points: a reference has a link, a plan has a document. */
export function noteTarget(n: Note): string {
  return n.url || n.file || "";
}

export function sortNotes(ns: Note[]): Note[] {
  return [...ns].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.updatedAt.localeCompare(a.updatedAt),
  );
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export function formatNoteLine(n: Note, idWidth = 0, b?: Board): string {
  const parts = [n.id.padEnd(idWidth), n.kind.padEnd(10), n.title];
  if (n.kind === "decision") parts.push(`(${decidedLabel(n)})`);
  if (isStepPlan(n)) parts.push(`(${b ? planLabel(b, n) : `${n.steps.length} steps`})`);
  const target = noteTarget(n);
  if (target) parts.push(`— ${clip(target, 60)}`);
  else if (n.body) parts.push(`— ${clip(oneLine(n.body), 60)}`);
  if (n.cards.length) parts.push(`→ ${n.cards.join(" ")}`);
  return parts.join("  ");
}

export function formatNoteDetail(ctx: Ctx, n: Note, b?: Board): string {
  const kind = n.kind === "plan" ? (isStepPlan(n) ? "step plan" : "plan document") : n.kind;
  const lines = [`${n.id}  ${n.title}`, `${kind} · updated ${ageLabel(ctx, n.updatedAt)} by ${n.updatedBy}`];
  if (n.kind === "decision")
    lines.push(`Decided: ${decidedLabel(n)}${n.confirmedAt ? ` ${ageLabel(ctx, n.confirmedAt)}` : ""}`);
  if (n.url) lines.push(`Link: ${n.url}`);
  if (n.file) lines.push(`File: ${n.file}`);
  if (n.cards.length) lines.push(`Cards: ${n.cards.join(", ")}`);
  if (n.body) lines.push("", n.body);
  if (isStepPlan(n)) {
    const doneCards = new Set((b?.features ?? []).filter((f) => f.status === "done").map((f) => f.key));
    lines.push("", b ? `Steps — ${planLabel(b, n)}:` : "Steps:");
    n.steps.forEach((s, i) => {
      const done = s.done || (!!s.card && doneCards.has(s.card));
      lines.push(`  [${done ? "x" : " "}] ${i + 1}. ${s.text}${s.card ? ` → ${s.card}` : ""}`);
    });
  }
  if (n.considered) lines.push("", "Considered:", n.considered);
  return lines.join("\n");
}
