// Which part of the product a card belongs to, worked out from its files.
//
// The board names its areas (Claude does, as it works) and says which folders
// each covers. A card's area is the one most of its files fall in; a card can
// also be put in an area by hand. Until an area is named, a card's files still
// group it under their top folder, so a new board is sorted from day one.

import type { Area, Board, Feature } from "./schema.js";

/** Folders that say nothing about where in the product something lives. */
const GENERIC = new Set(["src", "app", "apps", "lib", "libs", "packages", "source", "components", "pages", "public", "test", "tests"]);

const covers = (p: string, file: string) => file === p || file.startsWith(p.replace(/\/+$/, "") + "/");

/** The named area that covers a file, the most specific path winning. */
export function areaOfFile(areas: Area[], file: string): Area | undefined {
  let best: Area | undefined;
  let len = -1;
  for (const a of areas)
    for (const p of a.paths)
      if (covers(p, file) && p.length > len) {
        best = a;
        len = p.length;
      }
  return best;
}

/** A name for a file's place when no area covers it: its first telling folder. */
export function guessArea(file: string): string {
  const dirs = file.split("/").slice(0, -1);
  const d = dirs.find((x) => !GENERIC.has(x.toLowerCase()) && !x.startsWith(".")) ?? dirs[0];
  if (!d) return "";
  const words = d.replace(/[-_]+/g, " ").trim();
  return words.length <= 3 ? words.toUpperCase() : words[0]!.toUpperCase() + words.slice(1);
}

/** The card's area: the one it was put in, else the one most of its files are in. "" when it has neither. */
export function areaOf(board: Pick<Board, "areas">, f: Pick<Feature, "area" | "files">): string {
  if (f.area) return board.areas.find((a) => a.name.toLowerCase() === f.area.toLowerCase())?.name ?? f.area;
  const votes = new Map<string, number>();
  for (const file of f.files) {
    const name = areaOfFile(board.areas, file)?.name ?? guessArea(file);
    if (name) votes.set(name, (votes.get(name) ?? 0) + 1);
  }
  let best = "";
  let n = 0;
  for (const [name, c] of votes) if (c > n) [best, n] = [name, c];
  return best;
}

export function findArea(board: Pick<Board, "areas">, name: string): Area | undefined {
  return board.areas.find((a) => a.name.toLowerCase() === name.trim().toLowerCase());
}
