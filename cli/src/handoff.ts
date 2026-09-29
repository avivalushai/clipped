import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Env } from "./context.js";
import { VERSION } from "./version.js";

const parse = (v: string) => (/^\d+\.\d+\.\d+$/.test(v) ? v.split(".").map(Number) : undefined);
const newer = (a: number[], b: number[]) => {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! > b[i]!;
  return false;
};

/** The newest board.cjs installed next to this one (plugin cache keeps one
 *  folder per version: .../clipped/<version>/bin/board.cjs), if newer than us. */
export function findNewerCli(self: string, version: string = VERSION): string | undefined {
  const versionsDir = path.dirname(path.dirname(path.dirname(self)));
  let best: { v: number[]; file: string } | undefined;
  const mine = parse(version);
  if (!mine) return undefined;
  let names: string[];
  try {
    names = fs.readdirSync(versionsDir);
  } catch {
    return undefined;
  }
  for (const name of names) {
    const v = parse(name);
    const file = path.join(versionsDir, name, "bin", "board.cjs");
    if (!v || !newer(v, best?.v ?? mine) || !fs.existsSync(file)) continue;
    best = { v, file };
  }
  return best?.file;
}

/** Re-run argv with the newest installed CLI. Once only — the child won't hand off again. */
export function handoff(self: string, argv: string[], env: Env): number | undefined {
  if (env.CLIPPED_HANDED_OFF) return undefined;
  const file = findNewerCli(self);
  if (!file) return undefined;
  const r = spawnSync(process.execPath, [file, ...argv], {
    stdio: "inherit",
    env: { ...process.env, CLIPPED_HANDED_OFF: "1" },
  });
  return r.status ?? 1;
}
