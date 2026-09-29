// Pure helpers over a Board's notes: lookup, formatting, ordering.
// Notes are the tabs that aren't work — brainstorms, plans, decisions, references.

import { type Ctx, UserError, nowIso } from "./context.js";
import { ageLabel } from "./features.js";
import type { Actor, Board, Note, NoteKind } from "./schema.js";

export const KIND_ORDER: NoteKind[] = ["brainstorm", "plan", "decision", "reference"];

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

export function formatNoteLine(n: Note, idWidth = 0): string {
  const parts = [n.id.padEnd(idWidth), n.kind.padEnd(10), n.title];
  if (n.kind === "decision") parts.push(`(${decidedLabel(n)})`);
  const target = noteTarget(n);
  if (target) parts.push(`— ${clip(target, 60)}`);
  else if (n.body) parts.push(`— ${clip(oneLine(n.body), 60)}`);
  if (n.cards.length) parts.push(`→ ${n.cards.join(" ")}`);
  return parts.join("  ");
}

export function formatNoteDetail(ctx: Ctx, n: Note): string {
  const lines = [`${n.id}  ${n.title}`, `${n.kind} · updated ${ageLabel(ctx, n.updatedAt)} by ${n.updatedBy}`];
  if (n.kind === "decision")
    lines.push(`Decided: ${decidedLabel(n)}${n.confirmedAt ? ` ${ageLabel(ctx, n.confirmedAt)}` : ""}`);
  if (n.url) lines.push(`Link: ${n.url}`);
  if (n.file) lines.push(`File: ${n.file}`);
  if (n.cards.length) lines.push(`Cards: ${n.cards.join(", ")}`);
  if (n.body) lines.push("", n.body);
  if (n.considered) lines.push("", "Considered:", n.considered);
  return lines.join("\n");
}
