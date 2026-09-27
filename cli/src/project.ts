// Which folder is a project. Shared by the CLI (a board appears on the first
// card) and the server (folders worked in that have no board yet).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Ctx } from "./context.js";

export const claudeHome = (ctx: Ctx) =>
  ctx.env.CLIPPED_CLAUDE_HOME || ctx.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");

/**
 * Not every folder Claude Code opened is a project worth a board: it also works
 * in scratch workspaces, its own config directory, and sometimes $HOME itself.
 */
export function looksLikeAProject(ctx: Ctx, dir: string): boolean {
  const home = os.homedir();
  const resolved = path.resolve(dir);
  if (resolved === home || resolved === path.parse(resolved).root) return false;
  if (path.basename(resolved).startsWith(".")) return false;
  if (resolved.startsWith(path.resolve(claudeHome(ctx)) + path.sep)) return false;
  if (resolved.split(path.sep).includes("Library")) return false; // app support, scratch workspaces
  return true;
}

/** Where a new board belongs: the top of the git repo `cwd` is in, else `cwd` itself. */
export function projectRootFor(cwd: string): string {
  const start = path.resolve(cwd);
  for (let dir = start; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    if (path.dirname(dir) === dir) return start;
  }
}
