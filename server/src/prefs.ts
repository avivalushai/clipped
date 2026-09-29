// ~/.clipped/ui.json — the few UI choices that must outlast the browser: closing
// Getting started, finishing the tour. localStorage is per address (clipped.localhost
// and localhost are two), per browser, and gets cleared; this file is neither.

import fs from "node:fs";
import path from "node:path";
import { type Ctx, homeDir } from "../../cli/src/context.js";
import { writeJsonAtomic } from "../../cli/src/fsutil.js";

/** Only these keys, and only true/false — nothing about the boards themselves. */
export const PREF_KEYS = ["obHidden", "tourDone"] as const;
export type Prefs = Partial<Record<(typeof PREF_KEYS)[number], boolean>>;

const prefsFile = (ctx: Ctx) => path.join(homeDir(ctx), "ui.json");

export function readPrefs(ctx: Ctx): Prefs {
  try {
    const raw = JSON.parse(fs.readFileSync(prefsFile(ctx), "utf8"));
    return Object.fromEntries(PREF_KEYS.filter((k) => typeof raw[k] === "boolean").map((k) => [k, raw[k]]));
  } catch {
    return {};
  }
}

export function writePrefs(ctx: Ctx, patch: Record<string, unknown>): Prefs {
  const next = readPrefs(ctx);
  for (const k of PREF_KEYS) if (typeof patch[k] === "boolean") next[k] = patch[k] as boolean;
  fs.mkdirSync(homeDir(ctx), { recursive: true });
  writeJsonAtomic(prefsFile(ctx), next);
  return next;
}
