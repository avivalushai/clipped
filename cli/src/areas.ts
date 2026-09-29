// Which part of the product a card belongs to, worked out from its files.
//
// The board names its areas (Claude does, as it works) and says which folders
// each covers. A card's area is the one most of its files fall in; a card can
// also be put in an area by hand. Until an area is named, a card's files still
// group it under their top folder, so a new board is sorted from day one.

import type { Actor, Area, Board, Feature } from "./schema.js";

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

/** Who put the card in its area: the last "Area:" line in its log. An area with no such line was put there by hand. */
export function areaSetBy(f: Pick<Feature, "log">): Actor | "" {
  for (let i = (f.log?.length ?? 0) - 1; i >= 0; i--) if (f.log[i]!.text.startsWith("Area:")) return f.log[i]!.by;
  return "";
}

/** The area most of these files fall in ("" when none). */
function areaOfFiles(board: Pick<Board, "areas">, files: string[]): string {
  const votes = new Map<string, number>();
  for (const file of files) {
    const name = areaOfFile(board.areas, file)?.name ?? guessArea(file);
    if (name) votes.set(name, (votes.get(name) ?? 0) + 1);
  }
  let best = "";
  let n = 0;
  for (const [name, c] of votes) if (c > n) [best, n] = [name, c];
  return best;
}

/**
 * The card's area. One the user picked always wins. One Claude guessed holds until
 * the card has files, then the files decide — a guess made from a title shouldn't
 * outvote the code. With neither, "".
 */
export function areaOf(board: Pick<Board, "areas">, f: Pick<Feature, "area" | "files"> & { log?: Feature["log"] }): string {
  const fromFiles = areaOfFiles(board, f.files);
  if (f.area) {
    const guessed = f.log && areaSetBy({ log: f.log }) === "claude";
    if (guessed && fromFiles) return fromFiles;
    return board.areas.find((a) => a.name.toLowerCase() === f.area.toLowerCase())?.name ?? f.area;
  }
  return fromFiles;
}

export function findArea(board: Pick<Board, "areas">, name: string): Area | undefined {
  return board.areas.find((a) => a.name.toLowerCase() === name.trim().toLowerCase());
}
