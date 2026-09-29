// board.json schema (SPEC §3) and a dependency-free validator.

export const SCHEMA_VERSION = 6;

export const STATUSES = ["idea", "active", "parked", "review", "done"] as const;
export const TYPES = ["feature", "bug", "chore", "question"] as const;
export const NOTE_KINDS = ["brainstorm", "plan", "decision", "reference"] as const;
export const ACTORS = ["claude", "user"] as const;
export const GRANULARITIES = ["coarse", "normal", "fine"] as const;

export type Status = (typeof STATUSES)[number];
export type FeatureType = (typeof TYPES)[number];
export type NoteKind = (typeof NOTE_KINDS)[number];
export type Actor = (typeof ACTORS)[number];
export type Granularity = (typeof GRANULARITIES)[number];

export interface Step {
  text: string;
  done: boolean;
}

/** A step of a plan made in chat. It's ticked by hand, or by the card doing it being done. */
export interface PlanStep {
  text: string;
  done: boolean;
  /** The card doing this step ("" = nobody has started it as a card). */
  card: string;
}

export interface LogEntry {
  at: string;
  by: Actor;
  text: string;
}

export interface Feature {
  key: string;
  title: string;
  type: FeatureType;
  status: Status;
  note: string;
  doneWhen: string[];
  steps: Step[];
  files: string[];
  /** Where to see the work: a commit, a PR, a page. What "what to check" points at. */
  links: string[];
  /** An area named by hand ("" = worked out from the card's files). */
  area: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: Actor;
  log: LogEntry[];
}

/**
 * The tabs that aren't work: a brainstorm is a thinking session, a plan is a
 * document, a decision is a call that was made, a reference is a link. None of
 * them has a status, because none of them has a next step — that's what makes
 * them notes and not cards.
 */
export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  /** A brainstorm's or decision's other options — what was weighed and not chosen. */
  considered: string;
  /** A decision's author: who made the call ("" on every other kind). */
  decidedBy: Actor | "";
  /** When you agreed with a decision Claude made ("" = never checked). */
  confirmedAt: string;
  url: string;
  file: string;
  cards: string[]; // card keys this note produced or is about
  /** A step plan's steps, in order. Empty on every other note, and on a plan that is a document. */
  steps: PlanStep[];
  createdAt: string;
  updatedAt: string;
  updatedBy: Actor;
}

/**
 * A part of the product — a page, a surface, a package — and the folders it
 * covers. A card lands in an area through its files, so renaming an area once
 * moves every card in it.
 */
export interface Area {
  name: string;
  paths: string[];
}

export interface Board {
  schemaVersion: number;
  project: { name: string; key: string };
  settings: { granularity: Granularity };
  nextNum: number;
  nextNoteNum: number;
  features: Feature[];
  notes: Note[];
  areas: Area[];
}

export const KEY_RE = /^[A-Z][A-Z0-9]{1,5}$/;
export const NOTE_ID_RE = /^([A-Z][A-Z0-9]*)-N(\d+)$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const oneOf = <T extends readonly string[]>(list: T, v: unknown): v is T[number] =>
  isStr(v) && (list as readonly string[]).includes(v);

/** Returns a list of problems; empty means the board is valid. */
export function validateBoard(b: unknown): string[] {
  const errs: string[] = [];
  const err = (path: string, msg: string) => errs.push(`${path}: ${msg}`);

  if (!isObj(b)) return ["board: must be an object"];
  if (b.schemaVersion !== SCHEMA_VERSION) err("schemaVersion", `must be ${SCHEMA_VERSION}`);

  if (!isObj(b.project)) err("project", "must be an object");
  else {
    if (!isStr(b.project.name) || !b.project.name.trim()) err("project.name", "must be a non-empty string");
    if (!isStr(b.project.key) || !KEY_RE.test(b.project.key))
      err("project.key", "must be 2–6 uppercase letters/digits, starting with a letter");
  }

  if (!isObj(b.settings)) err("settings", "must be an object");
  else if (!oneOf(GRANULARITIES, b.settings.granularity))
    err("settings.granularity", `must be one of ${GRANULARITIES.join(", ")}`);

  for (const k of ["nextNum", "nextNoteNum"] as const)
    if (!Number.isInteger(b[k]) || (b[k] as number) < 1) err(k, "must be a positive integer");

  if (!Array.isArray(b.features)) {
    err("features", "must be an array");
    return errs;
  }

  const areaNames = new Set<string>();
  if (!Array.isArray(b.areas)) err("areas", "must be an array");
  else
    b.areas.forEach((a, i) => {
      if (!isObj(a) || !isStr(a.name) || !a.name.trim() || !Array.isArray(a.paths) || !a.paths.every(isStr))
        return err(`areas[${i}]`, "must be { name: string, paths: string[] }");
      if (areaNames.has(a.name.toLowerCase())) err(`areas[${i}].name`, `duplicate area ${a.name}`);
      areaNames.add(a.name.toLowerCase());
    });

  const projectKey = isObj(b.project) && isStr(b.project.key) ? b.project.key : null;
  const seen = new Set<string>();
  b.features.forEach((f, i) => {
    const p = `features[${i}]`;
    if (!isObj(f)) return err(p, "must be an object");

    const m = isStr(f.key) ? /^([A-Z][A-Z0-9]*)-(\d+)$/.exec(f.key) : null;
    if (!m) err(`${p}.key`, "must look like KEY-123");
    else {
      if (projectKey && m[1] !== projectKey) err(`${p}.key`, `prefix must be ${projectKey}`);
      if (Number.isInteger(b.nextNum) && Number(m[2]) >= (b.nextNum as number))
        err(`${p}.key`, "number must be below nextNum");
      if (seen.has(f.key as string)) err(`${p}.key`, `duplicate key ${f.key}`);
      seen.add(f.key as string);
    }

    if (!isStr(f.title) || !f.title.trim()) err(`${p}.title`, "must be a non-empty string");
    if (!oneOf(TYPES, f.type)) err(`${p}.type`, `must be one of ${TYPES.join(", ")}`);
    if (!oneOf(STATUSES, f.status)) err(`${p}.status`, `must be one of ${STATUSES.join(", ")}`);
    if (!isStr(f.note)) err(`${p}.note`, "must be a string");
    if (!Array.isArray(f.doneWhen) || !f.doneWhen.every(isStr)) err(`${p}.doneWhen`, "must be an array of strings");
    if (!Array.isArray(f.files) || !f.files.every(isStr)) err(`${p}.files`, "must be an array of strings");
    if (!Array.isArray(f.links) || !f.links.every(isStr)) err(`${p}.links`, "must be an array of strings");
    if (!isStr(f.area)) err(`${p}.area`, "must be a string");
    else if (f.area && !areaNames.has(f.area.toLowerCase())) err(`${p}.area`, `no area ${f.area} on this board`);

    if (!Array.isArray(f.steps)) err(`${p}.steps`, "must be an array");
    else
      f.steps.forEach((s, j) => {
        if (!isObj(s) || !isStr(s.text) || typeof s.done !== "boolean")
          err(`${p}.steps[${j}]`, "must be { text: string, done: boolean }");
      });

    for (const k of ["createdAt", "updatedAt"] as const)
      if (!isStr(f[k]) || !ISO_RE.test(f[k] as string)) err(`${p}.${k}`, "must be an ISO-8601 UTC timestamp");
    if (!oneOf(ACTORS, f.updatedBy)) err(`${p}.updatedBy`, `must be one of ${ACTORS.join(", ")}`);

    if (!Array.isArray(f.log)) err(`${p}.log`, "must be an array");
    else
      f.log.forEach((e, j) => {
        if (!isObj(e) || !isStr(e.at) || !ISO_RE.test(e.at) || !oneOf(ACTORS, e.by) || !isStr(e.text))
          err(`${p}.log[${j}]`, "must be { at: ISO timestamp, by: claude|user, text: string }");
      });
  });

  if (!Array.isArray(b.notes)) {
    err("notes", "must be an array");
    return errs;
  }

  const seenNotes = new Set<string>();
  b.notes.forEach((n, i) => {
    const p = `notes[${i}]`;
    if (!isObj(n)) return err(p, "must be an object");

    const m = isStr(n.id) ? NOTE_ID_RE.exec(n.id) : null;
    if (!m) err(`${p}.id`, "must look like KEY-N12");
    else {
      if (projectKey && m[1] !== projectKey) err(`${p}.id`, `prefix must be ${projectKey}`);
      if (Number.isInteger(b.nextNoteNum) && Number(m[2]) >= (b.nextNoteNum as number))
        err(`${p}.id`, "number must be below nextNoteNum");
      if (seenNotes.has(n.id as string)) err(`${p}.id`, `duplicate id ${n.id}`);
      seenNotes.add(n.id as string);
    }

    if (!oneOf(NOTE_KINDS, n.kind)) err(`${p}.kind`, `must be one of ${NOTE_KINDS.join(", ")}`);
    if (!isStr(n.title) || !n.title.trim()) err(`${p}.title`, "must be a non-empty string");
    for (const k of ["body", "considered", "url", "file"] as const) if (!isStr(n[k])) err(`${p}.${k}`, "must be a string");
    if (n.kind === "decision" ? !oneOf(ACTORS, n.decidedBy) : n.decidedBy !== "")
      err(`${p}.decidedBy`, n.kind === "decision" ? `must be one of ${ACTORS.join(", ")}` : "must be empty unless the note is a decision");
    if (!isStr(n.confirmedAt) || (n.confirmedAt !== "" && !ISO_RE.test(n.confirmedAt)))
      err(`${p}.confirmedAt`, "must be empty or an ISO-8601 UTC timestamp");
    if (!Array.isArray(n.cards) || !n.cards.every(isStr)) err(`${p}.cards`, "must be an array of card keys");
    else for (const key of n.cards as string[]) if (!seen.has(key)) err(`${p}.cards`, `no card ${key} on this board`);
    if (!Array.isArray(n.steps)) err(`${p}.steps`, "must be an array");
    else {
      if (n.steps.length && n.kind !== "plan") err(`${p}.steps`, "only a plan has steps");
      n.steps.forEach((s, j) => {
        if (!isObj(s) || !isStr(s.text) || !s.text.trim() || typeof s.done !== "boolean" || !isStr(s.card))
          return err(`${p}.steps[${j}]`, "must be { text: string, done: boolean, card: string }");
        if (s.card && !seen.has(s.card)) err(`${p}.steps[${j}].card`, `no card ${s.card} on this board`);
      });
    }

    for (const k of ["createdAt", "updatedAt"] as const)
      if (!isStr(n[k]) || !ISO_RE.test(n[k] as string)) err(`${p}.${k}`, "must be an ISO-8601 UTC timestamp");
    if (!oneOf(ACTORS, n.updatedBy)) err(`${p}.updatedBy`, `must be one of ${ACTORS.join(", ")}`);
  });

  return errs;
}

export function emptyBoard(name: string, key: string): Board {
  return {
    schemaVersion: SCHEMA_VERSION,
    project: { name, key },
    settings: { granularity: "normal" },
    nextNum: 1,
    nextNoteNum: 1,
    features: [],
    notes: [],
    areas: [],
  };
}
