// How much Claude Code has been used in each project, from its own session logs
// under ~/.claude/projects. Only two things are read from those files: the
// folder a session was started in (`cwd`) and the timestamps of its entries.
// What was said is never read, and nothing leaves the machine.

import fs from "node:fs";
import path from "node:path";
import type { Ctx } from "../../cli/src/context.js";
import { claudeHome } from "../../cli/src/project.js";

export interface SessionStats {
  sessions: number;
  /** Time between entries, with any gap over five minutes counted as five. */
  activeMs: number;
  /** First entry to last, per session — includes time a session sat open idle. */
  openMs: number;
  lastAt: string | null;
}

interface FileStats {
  cwd: string | null;
  firstAt: number;
  lastAt: number;
  activeMs: number;
}

/** A gap longer than this means nobody was working; it counts as this much. */
export const IDLE_CAP_MS = 5 * 60_000;

/* Session logs only ever grow at the end, and a long session reaches tens of MB.
   So each file is read once, then only the lines appended since. */
interface Tracked extends FileStats {
  offset: number; // bytes consumed, always at a line boundary
  mtimeMs: number;
}
const cache = new Map<string, Tracked>();

const CWD_RE = /"cwd":"((?:[^"\\]|\\.)*)"/;
const TS_RE = /"timestamp":"([0-9T:.\-+Z]+)"/g;
const CHUNK = 8 * 1024 * 1024;

function consume(t: Tracked, text: string): void {
  if (t.cwd === null) {
    const m = CWD_RE.exec(text);
    if (m) {
      try {
        t.cwd = JSON.parse(`"${m[1]}"`);
      } catch {
        /* keep looking in the next chunk */
      }
    }
  }
  for (const m of text.matchAll(TS_RE)) {
    const ts = Date.parse(m[1]!);
    if (!Number.isFinite(ts)) continue;
    if (!t.firstAt || ts < t.firstAt) t.firstAt = ts;
    if (t.lastAt) t.activeMs += Math.min(Math.max(ts - t.lastAt, 0), IDLE_CAP_MS);
    if (ts > t.lastAt) t.lastAt = ts;
  }
}

/** Read from the tracked offset to the end, in chunks, cutting at newline bytes
    (never mid-character), so the offset always lands on a line boundary. */
function advance(file: string, t: Tracked, size: number): void {
  let fd: number;
  try {
    fd = fs.openSync(file, "r");
  } catch {
    return;
  }
  try {
    const buf = Buffer.alloc(CHUNK);
    let pos = t.offset;
    while (pos < size) {
      const n = fs.readSync(fd, buf, 0, Math.min(CHUNK, size - pos), pos);
      if (n <= 0) break;
      const end = buf.lastIndexOf(10, n - 1);
      if (end < 0) {
        if (n < CHUNK) break; // an unfinished last line: wait for the rest
        pos += n; // one line longer than a chunk (a huge tool result): skip it
        t.offset = pos;
        continue;
      }
      consume(t, buf.toString("utf8", 0, end + 1));
      pos += end + 1;
      t.offset = pos;
    }
  } finally {
    fs.closeSync(fd);
  }
}

/** The folder a session was started in, from the head of the file. */
function peekCwd(file: string): string | null {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(64 * 1024);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    const m = CWD_RE.exec(buf.toString("utf8", 0, n));
    return m ? JSON.parse(`"${m[1]}"`) : null;
  } catch {
    return null;
  }
}

function statsFor(file: string, wanted?: (cwd: string) => boolean): FileStats | null {
  let st: fs.Stats;
  try {
    st = fs.statSync(file);
  } catch {
    cache.delete(file);
    return null;
  }
  let t = cache.get(file);
  if (!t || st.size < t.offset) {
    // new, or rewritten shorter: start over
    t = { cwd: null, firstAt: 0, lastAt: 0, activeMs: 0, offset: 0, mtimeMs: 0 };
    cache.set(file, t);
  }
  // Sessions outside every project are never read past their first line.
  if (wanted && t.offset === 0) {
    const cwd = t.cwd ?? peekCwd(file);
    t.cwd = cwd;
    if (!cwd || !wanted(cwd)) return null;
  }
  if (st.size > t.offset && st.mtimeMs !== t.mtimeMs) advance(file, t, st.size);
  t.mtimeMs = st.mtimeMs;
  return t.firstAt ? t : null;
}

/** For tests: read one file from scratch. */
export function readSessionFile(file: string): FileStats | null {
  cache.delete(file);
  return statsFor(file);
}

/** Every session file Claude Code has kept, with where it was started and when. */
function allSessions(ctx: Ctx, wanted: (cwd: string) => boolean): FileStats[] {
  const dir = path.join(claudeHome(ctx), "projects");
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const out: FileStats[] = [];
  for (const entry of entries) {
    const projectDir = path.join(dir, entry);
    let files: string[];
    try {
      files = fs.readdirSync(projectDir).filter((f) => f.endsWith(".jsonl"));
    } catch {
      continue;
    }
    for (const f of files) {
      const s = statsFor(path.join(projectDir, f), wanted);
      if (s?.cwd) out.push(s);
    }
  }
  return out;
}

/** A session belongs to a project when it was started in its folder or below it. */
const inside = (cwd: string, root: string) => cwd === root || cwd.startsWith(root.endsWith("/") ? root : root + "/");

export function sessionStats(ctx: Ctx, roots: string[]): Map<string, SessionStats> {
  const sessions = allSessions(ctx, (cwd) => roots.some((r) => inside(cwd, r)));
  const result = new Map<string, SessionStats>();
  for (const root of roots) {
    // The deepest matching root wins, so a nested project doesn't count its parent's sessions twice.
    const mine = sessions.filter((s) => inside(s.cwd!, root) && !roots.some((r) => r !== root && r.length > root.length && inside(s.cwd!, r)));
    const lastAt = mine.reduce((a, s) => Math.max(a, s.lastAt), 0);
    result.set(root, {
      sessions: mine.length,
      activeMs: mine.reduce((a, s) => a + s.activeMs, 0),
      openMs: mine.reduce((a, s) => a + (s.lastAt - s.firstAt), 0),
      lastAt: lastAt ? new Date(lastAt).toISOString() : null,
    });
  }
  return result;
}
