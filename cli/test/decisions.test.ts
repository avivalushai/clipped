import { describe, expect, it } from "vitest";
import { handleApi } from "../../server/src/api.js";
import { projectId } from "../../server/src/projects.js";
import { migrate } from "../src/migrations.js";
import { SCHEMA_VERSION, validateBoard } from "../src/schema.js";
import { type Sandbox, withBoard } from "./helpers.js";

const api = (sb: Sandbox, method: string, route: string, body?: unknown) =>
  handleApi({ cwd: sb.root, env: sb.env, out: () => {}, err: () => {} }, { method, path: route, body }) as any;

describe("decisions", () => {
  it("records who made the call — whoever writes it down, unless told otherwise", () => {
    const sb = withBoard();
    const mine = sb.json("note", "add", "decision", "Dark by default", "--body", "Dark, with a light switch", "--considered", "Light only — flat next to the terminal");
    expect(mine).toMatchObject({ id: "APP-N1", kind: "decision", decidedBy: "claude", confirmedAt: "" });
    const yours = sb.json("note", "add", "decision", "Rename to Clipped", "--decided-by", "user");
    expect(yours.decidedBy).toBe("user");
    expect(sb.json("note", "add", "brainstorm", "Names").decidedBy).toBe("");
    expect(validateBoard(sb.read())).toEqual([]);
  });

  it("says whose call it is in list, show and the session brief", () => {
    const sb = withBoard();
    sb.json("note", "add", "decision", "Dark by default");
    sb.json("note", "add", "decision", "Rename to Clipped", "--decided-by", "user");
    const list = sb.board("note", "list", "--kind", "decision").out;
    expect(list).toContain("Dark by default  (Claude's call, unchecked)");
    expect(list).toContain("Rename to Clipped  (your call)");
    expect(sb.board("note", "show", "APP-N1").out).toContain("Decided: Claude's call, unchecked");
    expect(sb.board("context").out).toContain("2 decisions (1 mine, unchecked)");
  });

  it("only you can agree with Claude's call", () => {
    const sb = withBoard();
    sb.json("note", "add", "decision", "Dark by default");
    expect(sb.board("note", "confirm", "APP-N1").err).toContain("only you can agree");
    const n = sb.json("note", "confirm", "APP-N1", "--by", "user");
    expect(n).toMatchObject({ confirmedAt: "2026-09-20T10:00:00Z", updatedBy: "user" });
    expect(sb.board("note", "show", "APP-N1").out).toContain("Claude's call, you agreed");
    expect(sb.board("context").out).not.toContain("unchecked)");
  });

  it("keeps decidedBy to decisions", () => {
    const sb = withBoard();
    sb.json("note", "add", "brainstorm", "Themes");
    expect(sb.board("note", "add", "plan", "P", "--decided-by", "user").err).toContain("only for decisions");
    expect(sb.board("note", "update", "APP-N1", "--decided-by", "user").err).toContain("only for decisions");
    expect(sb.board("note", "confirm", "APP-N1", "--by", "user").err).toContain("not a decision");
    // A brainstorm that settled something becomes a decision, and back.
    expect(sb.json("note", "update", "APP-N1", "--kind", "decision").decidedBy).toBe("claude");
    expect(sb.json("note", "update", "APP-N1", "--decided-by", "user").decidedBy).toBe("user");
    expect(sb.json("note", "update", "APP-N1", "--kind", "brainstorm")).toMatchObject({ decidedBy: "", confirmedAt: "" });
    expect(validateBoard(sb.read())).toEqual([]);
  });

  it("the API passes decidedBy and agrees as you", () => {
    const sb = withBoard();
    const id = projectId(sb.root);
    const n = api(sb, "POST", `/api/projects/${id}/notes`, { kind: "decision", title: "Rows open on click", decidedBy: "claude" });
    expect(n.decidedBy).toBe("claude");
    expect(api(sb, "PATCH", `/api/projects/${id}/notes/${n.id}`, { confirmed: true }).confirmedAt).not.toBe("");
  });
});

describe("schema v5", () => {
  it("migrates a v4 board: every note gets an empty decidedBy and confirmedAt", () => {
    const sb = withBoard();
    sb.json("note", "add", "brainstorm", "Themes");
    const v4 = sb.read() as any;
    v4.schemaVersion = 4;
    for (const n of v4.notes) delete n.decidedBy, delete n.confirmedAt;
    const { board, from, to } = migrate(v4);
    expect({ from, to }).toEqual({ from: 4, to: SCHEMA_VERSION });
    expect((board.notes as any[])[0]).toMatchObject({ decidedBy: "", confirmedAt: "" });
    expect(validateBoard(board)).toEqual([]);
  });
});
