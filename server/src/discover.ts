// Projects Claude Code has worked in that don't have a board yet.
//
// Claude Code keeps one folder per project under ~/.claude/projects, named by a
// lossy encoding of the path (dashes in folder names are indistinguishable from
// separators). So the path is read from the `cwd` field of a session file
// instead of decoded from the name — and nothing else in those files is read.

import fs from "node:fs";
import path from "node:path";
import { prettyName } from "../../cli/src/commands.js";
import type { Ctx } from "../../cli/src/context.js";
import { claudeHome, looksLikeAProject } from "../../cli/src/project.js";
import { readRegistry } from "../../cli/src/registry.js";
import { boardFileFor } from "../../cli/src/store.js";
import { projectId } from "./projects.js";

export interface Candidate {
  id: string;
  path: string;
  name: string;
  lastSeen: string;
  /** One line on what the project is, from its own package.json or README. */
  about?: string;
  lang?: string;
}

/* What a folder is, from the folder itself — the project's own files, never a conversation. */
const LANGS: [string, string][] = [
  ["tsconfig.json", "TypeScript"], ["package.json", "JavaScript"], ["pyproject.toml", "Python"], ["requirements.txt", "Python"],
  ["Cargo.toml", "Rust"], ["go.mod", "Go"], ["Package.swift", "Swift"], ["Gemfile", "Ruby"], ["pom.xml", "Java"], ["build.gradle", "Kotlin/Java"],
];
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
export function describeFolder(dir: string): { about?: string; lang?: string } {
  const out: { about?: string; lang?: string } = {};
  try {
    const names = new Set(fs.readdirSync(dir));
    const hit = LANGS.find(([f]) => names.has(f));
    if (hit) out.lang = hit[1];
    else if ([...names].some((n) => n.endsWith(".xcodeproj"))) out.lang = "Swift";
    if (names.has("package.json")) {
      const d = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).description;
      if (typeof d === "string" && d.trim()) out.about = clip(d.trim(), 90);
    }
    const readme = [...names].find((n) => /^readme(\.md|\.txt)?$/i.test(n));
    if (!out.about && readme) {
      const lines = fs.readFileSync(path.join(dir, readme), "utf8").slice(0, 4000).split("\n");
      // The first paragraph of prose: skip headings, badges, html and rules; join its wrapped lines.
      const skip = (l: string) => /^(#|!\[|\[!|<|---|```|=+$|-+$)/.test(l);
      const t = lines.map((l) => l.trim());
      const start = t.findIndex((l) => l && !skip(l));
      let line = "";
      for (let i = start; start >= 0 && i < t.length && t[i] && !skip(t[i]!); i++) line += (line ? " " : "") + t[i];
      if (line) out.about = clip(line.replace(/[*_`]/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"), 90);
    }
  } catch {
    /* unreadable folder: say nothing */
  }
  return out;
}

/** First `cwd` in a session file. Reads a bounded prefix — transcripts get large. */
function cwdFromSession(file: string): string | null {
  let text: string;
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(64 * 1024);
    const read = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    text = buf.subarray(0, read).toString("utf8");
  } catch {
    return null;
  }
  for (const line of text.split("\n")) {
    if (!line.includes('"cwd"')) continue;
    try {
      const cwd = (JSON.parse(line) as { cwd?: unknown }).cwd;
      if (typeof cwd === "string" && cwd.startsWith("/")) return cwd;
    } catch {
      /* a truncated last line is expected */
    }
  }
  return null;
}

/** Folders worked in, still present on disk, with no board and not registered. */
export function discoverProjects(ctx: Ctx): Candidate[] {
  const dir = path.join(claudeHome(ctx), "projects");
  if (!fs.existsSync(dir)) return [];
  const registered = new Set(readRegistry(ctx).map((e) => e.path));
  const found = new Map<string, Candidate>();

  for (const entry of fs.readdirSync(dir)) {
    const projectDir = path.join(dir, entry);
    let sessions: string[];
    try {
      if (!fs.statSync(projectDir).isDirectory()) continue;
      sessions = fs.readdirSync(projectDir).filter((f) => f.endsWith(".jsonl"));
    } catch {
      continue;
    }
    if (!sessions.length) continue;

    const newest = sessions
      .map((f) => path.join(projectDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]!;
    const cwd = cwdFromSession(newest);
    if (!cwd || registered.has(cwd) || found.has(cwd)) continue;
    if (!fs.existsSync(cwd) || fs.existsSync(boardFileFor(cwd))) continue;
    if (!looksLikeAProject(ctx, cwd)) continue;

    found.set(cwd, { id: projectId(cwd), path: cwd, name: prettyName(cwd), lastSeen: new Date(fs.statSync(newest).mtimeMs).toISOString(), ...describeFolder(cwd) });
  }

  return [...found.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

/** A board may only be created in a folder we already know about. */
export const isKnownProject = (ctx: Ctx, candidate: string) =>
  discoverProjects(ctx).some((c) => c.path === path.resolve(candidate));
