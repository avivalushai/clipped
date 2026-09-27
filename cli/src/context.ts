import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Actor } from "./schema.js";

/** Environment as the CLI cares about it — not NodeJS.ProcessEnv, whose shape
 *  changes with whatever @types packages happen to be installed. */
export type Env = Record<string, string | undefined>;

/** Everything a command needs from the outside world — injectable for tests. */
export interface Ctx {
  cwd: string;
  env: Env;
  out: (line: string) => void;
  err: (line: string) => void;
}

export class UserError extends Error {}

/** ~/.clipped, overridable with CLIPPED_HOME. */
export const homeDir = (ctx: Ctx) => {
  const dir = ctx.env.CLIPPED_HOME || path.join(os.homedir(), ".clipped");
  if (!fs.existsSync(dir)) adoptLegacyHome(ctx, dir);
  return dir;
};

/**
 * The tool was called Loose Ends until 0.3.0. No board was ever kept in here —
 * those live in each repo — but the registry of them is, and losing it empties
 * the sidebar without telling anyone. Moved on the first command after the
 * rename, and never again: once the new home exists this doesn't run.
 */
function adoptLegacyHome(ctx: Ctx, dir: string): void {
  // A pointed home means a test or a sandbox: never reach into the real one from there.
  const old = ctx.env.CLIPPED_LEGACY_HOME ?? (ctx.env.CLIPPED_HOME ? "" : path.join(os.homedir(), ".loose-ends"));
  if (!old || old === dir) return;
  try {
    if (fs.existsSync(old)) fs.renameSync(old, dir);
  } catch {
    /* a home we can't move is not worth failing a command over */
  }
}

/** Current time as ISO string; CLIPPED_NOW pins it (tests). */
export const nowIso = (ctx: Ctx) => {
  const pinned = ctx.env.CLIPPED_NOW;
  return (pinned ? new Date(pinned) : new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
};

/** Who is writing: --by wins, then CLIPPED_BY, then "claude" inside Claude Code, else "user". */
export function actor(ctx: Ctx, flag?: string): Actor {
  const v = flag ?? ctx.env.CLIPPED_BY ?? (ctx.env.CLAUDECODE ? "claude" : "user");
  if (v !== "claude" && v !== "user") throw new UserError(`--by must be claude or user (got "${v}")`);
  return v;
}
