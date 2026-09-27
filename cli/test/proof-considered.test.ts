import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { handleApi } from "../../server/src/api.js";
import { projectId, repoUrl } from "../../server/src/projects.js";
import { migrate } from "../src/migrations.js";
import { validateBoard } from "../src/schema.js";
import { type Sandbox, withBoard } from "./helpers.js";

const api = (sb: Sandbox, method: string, route: string, body?: unknown) =>
  handleApi({ cwd: sb.root, env: sb.env, out: () => {}, err: () => {} }, { method, path: route, body }) as any;

describe("proof links on cards", () => {
  it("adds links on add, update and review, without duplicates", () => {
    const sb = withBoard();
    expect(sb.json("add", "Save loops", "--link", "https://example.com/pr/1").links).toEqual(["https://example.com/pr/1"]);
    const f = sb.json("update", "APP-1", "--link", "3f7aca3", "--link", "https://example.com/pr/1");
    expect(f.links).toEqual(["https://example.com/pr/1", "3f7aca3"]);
    const r = sb.json("review", "APP-1", "--check", "Save a loop and reload", "--link", "https://my-app.dev/library");
    expect(r).toMatchObject({ status: "review", links: ["https://example.com/pr/1", "3f7aca3", "https://my-app.dev/library"] });
    expect(r.log.at(-1).text).toBe("Proof: https://my-app.dev/library");
    expect(validateBoard(sb.read())).toEqual([]);
  });

  it("removes a link with --unlink, and a link alone is enough to update", () => {
    const sb = withBoard();
    sb.json("add", "Save loops", "--link", "abc1234", "--link", "https://x.dev");
    expect(sb.json("update", "APP-1", "--unlink", "abc1234").links).toEqual(["https://x.dev"]);
    expect(sb.board("show", "APP-1").out).toContain("Proof:\n  https://x.dev");
  });

  it("keeps both cards' links when merging", () => {
    const sb = withBoard();
    sb.json("add", "Save loops", "--link", "a1b2c3d");
    sb.json("add", "Save button", "--link", "e4f5a6b");
    expect(sb.json("merge", "APP-2", "--into", "APP-1").links).toEqual(["a1b2c3d", "e4f5a6b"]);
  });
});

describe("what a brainstorm considered", () => {
  it("stores and updates the options that weren't chosen", () => {
    const sb = withBoard();
    const n = sb.json("note", "add", "brainstorm", "Board or table?", "--body", "Board", "--considered", "Table: denser, but hides status");
    expect(n).toMatchObject({ considered: "Table: denser, but hides status" });
    expect(sb.json("note", "update", n.id, "--considered", "Table; a list view").considered).toBe("Table; a list view");
    expect(sb.board("note", "show", n.id).out).toContain("Considered:\nTable; a list view");
    expect(validateBoard(sb.read())).toEqual([]);
  });
});

describe("schema v3", () => {
  it("migrates a v2 board: cards get empty links, notes an empty considered", () => {
    const v2 = {
      schemaVersion: 2,
      project: { name: "A", key: "APP" },
      settings: { granularity: "normal" },
      nextNum: 2,
      nextNoteNum: 2,
      features: [{ key: "APP-1", title: "x", type: "feature", status: "idea", note: "", doneWhen: [], steps: [], files: [],
        createdAt: "2026-09-20T10:00:00Z", updatedAt: "2026-09-20T10:00:00Z", updatedBy: "claude", log: [] }],
      notes: [{ id: "APP-N1", kind: "brainstorm", title: "y", body: "", url: "", file: "", cards: [],
        createdAt: "2026-09-20T10:00:00Z", updatedAt: "2026-09-20T10:00:00Z", updatedBy: "claude" }],
    };
    const { board, from, to } = migrate(v2);
    expect({ from, to }).toEqual({ from: 2, to: 3 });
    expect((board.features as any[])[0].links).toEqual([]);
    expect((board.notes as any[])[0].considered).toBe("");
    expect(validateBoard(board)).toEqual([]);
  });

  it("upgrades a v2 file on the next write", () => {
    const sb = withBoard();
    const b = sb.read();
    sb.write({ ...b, schemaVersion: 2, notes: [] });
    sb.json("add", "Save loops");
    expect(sb.read()).toMatchObject({ schemaVersion: 3, features: [{ links: [] }] });
  });
});

describe("the API", () => {
  it("diffs a PATCHed links list into --link and --unlink", () => {
    const sb = withBoard();
    sb.json("add", "Save loops", "--link", "a1b2c3d");
    const id = projectId(sb.root);
    const f = api(sb, "PATCH", `/api/projects/${id}/features/APP-1`, { links: ["https://x.dev"] });
    expect(f.links).toEqual(["https://x.dev"]);
  });

  it("accepts considered on notes", () => {
    const sb = withBoard();
    const id = projectId(sb.root);
    const n = api(sb, "POST", `/api/projects/${id}/notes`, { kind: "brainstorm", title: "Board or table?", considered: "Table" });
    expect(api(sb, "PATCH", `/api/projects/${id}/notes/${n.id}`, { considered: "Table, list" }).considered).toBe("Table, list");
  });

  it("reads the repo's web address from .git/config", () => {
    const sb = withBoard();
    fs.mkdirSync(path.join(sb.root, ".git"));
    const cfg = (url: string) =>
      fs.writeFileSync(path.join(sb.root, ".git/config"), `[core]\n\tbare = false\n[remote "origin"]\n\turl = ${url}\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n`);
    cfg("git@github.com:me/my-app.git");
    expect(repoUrl(sb.root)).toBe("https://github.com/me/my-app");
    cfg("https://gitlab.com/me/my-app");
    expect(repoUrl(sb.root)).toBe("https://gitlab.com/me/my-app");
    cfg("/local/mirror.git");
    expect(repoUrl(sb.root)).toBeUndefined();
  });
});
