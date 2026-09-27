import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { run } from "../src/cli.js";
import { sandbox } from "./helpers.js";

describe("a board appears on the first card", () => {
  it("board add in a folder with no board makes one, named after the folder", () => {
    const sb = sandbox();
    const r = sb.board("add", "Games list", "--status", "active");
    expect(r.code).toBe(0);
    expect(r.out).toBe(`Created board My App (MY) in ${path.join(sb.root, ".board")}/\nAdded MY-1 Games list (active)`);
    expect(sb.read().project).toEqual({ name: "My App", key: "MY" });
    expect(sb.registry()).toEqual([{ path: sb.root, name: "My App", key: "MY", addedAt: "2026-09-20T10:00:00Z" }]);
    expect(fs.existsSync(path.join(sb.root, ".board/.gitignore"))).toBe(true);
  });

  it("board ask and board note add do too, and --json stays pure JSON", () => {
    const sb = sandbox();
    const q = sb.json("ask", "Unity or Godot?");
    expect(q.key).toBe("MY-1");
    expect(q.type).toBe("question");

    const other = sandbox();
    const n = other.json("note", "add", "reference", "Top games by genre");
    expect(n.id).toBe("MY-N1");
  });

  it("puts the board at the top of the git repo, not in the subfolder Claude is in", () => {
    const sb = sandbox();
    fs.mkdirSync(path.join(sb.root, ".git"));
    const sub = path.join(sb.root, "src", "ui");
    fs.mkdirSync(sub, { recursive: true });
    const out: string[] = [];
    const code = run(["add", "Filter by genre"], { cwd: sub, env: sb.env, out: (l) => out.push(l), err: () => {} });
    expect(code).toBe(0);
    expect(fs.existsSync(path.join(sb.root, ".board/board.json"))).toBe(true);
    expect(fs.existsSync(path.join(sub, ".board"))).toBe(false);
  });

  it("refuses in the home folder and in hidden folders, and says how to do it anyway", () => {
    const sb = sandbox();
    const hidden = path.join(sb.root, ".scratch");
    fs.mkdirSync(hidden);
    const err: string[] = [];
    const code = run(["add", "Something"], { cwd: hidden, env: sb.env, out: () => {}, err: (l) => err.push(l) });
    expect(code).toBe(1);
    expect(err.join("\n")).toContain("doesn't look like a project folder");
    expect(fs.existsSync(path.join(hidden, ".board"))).toBe(false);

    const homeErr: string[] = [];
    const homeCode = run(["ask", "Anything?"], { cwd: os.homedir(), env: sb.env, out: () => {}, err: (l) => homeErr.push(l) });
    expect(homeCode).toBe(1);
    expect(fs.existsSync(path.join(os.homedir(), ".board"))).toBe(false);
  });

  it("changing a card still needs a board — only adding makes one", () => {
    const sb = sandbox();
    const r = sb.board("update", "1", "--note", "x");
    expect(r.code).toBe(1);
    expect(fs.existsSync(path.join(sb.root, ".board"))).toBe(false);
  });

  it("answering a question again fills in the same card instead of moving it twice", () => {
    const sb = sandbox();
    sb.board("ask", "Top 3 games per genre", "--status", "active");
    sb.board("answer", "1", "Shooter: PUBG, CoD, Free Fire");
    sb.board("answer", "1", "Shooter: PUBG, CoD, Free Fire. Swapped Beatstar for Tiles Hop");
    const card = sb.read().features[0];
    expect(sb.read().features).toHaveLength(1);
    expect(card.note).toBe("Shooter: PUBG, CoD, Free Fire. Swapped Beatstar for Tiles Hop");
    expect(card.log.map((e: { text: string }) => e.text)).toEqual([
      "Created — active",
      "Moved to review — Shooter: PUBG, CoD, Free Fire",
      "Updated — Shooter: PUBG, CoD, Free Fire. Swapped Beatstar for Tiles Hop",
    ]);
  });

  it("context tells Claude a board comes on its own, instead of offering init", () => {
    const sb = sandbox();
    const out = sb.board("context").out;
    expect(out).toContain("the first `board add` or `board ask` makes one");
    expect(out).not.toMatch(/Offer to create/);
  });
});
