import { describe, expect, it } from "vitest";
import { handleApi } from "../../server/src/api.js";
import { projectId } from "../../server/src/projects.js";
import { migrate } from "../src/migrations.js";
import { SCHEMA_VERSION, validateBoard } from "../src/schema.js";
import { type Sandbox, withBoard } from "./helpers.js";

const api = (sb: Sandbox, method: string, route: string, body?: unknown) =>
  handleApi({ cwd: sb.root, env: sb.env, out: () => {}, err: () => {} }, { method, path: route, body }) as any;

describe("step plans", () => {
  it("keeps a plan made in chat as one plan with its steps, in order", () => {
    const sb = withBoard();
    const n = sb.json("note", "add", "plan", "First-run experience", "--body", "A new user sees their projects fill in live",
      "--step", "Welcome header", "--step", "Projects list", "--step", "Live stream");
    expect(n).toMatchObject({ id: "APP-N1", kind: "plan", steps: [
      { text: "Welcome header", done: false, card: "" },
      { text: "Projects list", done: false, card: "" },
      { text: "Live stream", done: false, card: "" },
    ] });
    expect(validateBoard(sb.read())).toEqual([]);
    expect(sb.board("note", "list").out).toContain("First-run experience  (step 1 of 3)");
    const show = sb.board("note", "show", "APP-N1").out;
    expect(show).toContain("step plan ·");
    expect(show).toContain("[ ] 2. Projects list");
  });

  it("ticks steps by number, and a step is done once the card doing it is", () => {
    const sb = withBoard();
    sb.json("note", "add", "plan", "Onboarding", "--step", "Header", "--step", "List", "--step", "Stream");
    sb.json("add", "The projects list", "--status", "active");
    expect(sb.board("note", "step", "APP-N1", "1", "--done").out).toContain("(step 2 of 3)");
    const n = sb.json("note", "step", "APP-N1", "2", "--card", "APP-1");
    expect(n.steps[1].card).toBe("APP-1");
    expect(n.cards).toContain("APP-1");
    sb.json("done", "APP-1", "--by", "user");
    expect(sb.board("note", "list").out).toContain("(step 3 of 3)");
    sb.json("note", "step", "APP-N1", "Push notifications");
    expect(sb.board("note", "show", "APP-N1").out).toContain("[x] 2. List → APP-1");
    sb.json("note", "step", "APP-N1", "4", "--remove");
    sb.json("note", "step", "APP-N1", "3", "--done");
    expect(sb.board("note", "list").out).toContain("(all 3 steps done)");
  });

  it("moves past a step whose card waits for review, and says how many wait", () => {
    const sb = withBoard();
    sb.json("note", "add", "plan", "Builder", "--step", "Canvas", "--step", "Editor", "--step", "Export");
    sb.json("add", "Canvas", "--status", "review");
    sb.json("add", "Editor", "--status", "review");
    sb.json("add", "Export", "--status", "active");
    for (const i of [1, 2, 3]) sb.json("note", "step", "APP-N1", String(i), "--card", `APP-${i}`);
    expect(sb.board("note", "list").out).toContain("(step 3 of 3 · 2 to review)");
    expect(sb.board("note", "show", "APP-N1").out).toContain("[ ] 1. Canvas → APP-1"); // not done until checked
    sb.json("update", "APP-3", "--status", "review");
    expect(sb.board("note", "list").out).toContain("(all 3 steps built, 3 to review)");
    expect(sb.board("context").out).not.toContain("APP-N1 Builder —"); // nothing left for Claude
    for (const k of ["APP-1", "APP-2", "APP-3"]) sb.json("done", k, "--by", "user");
    expect(sb.board("note", "list").out).toContain("(all 3 steps done)");
  });

  it("puts a plan still under way in the session brief, with the step we're on", () => {
    const sb = withBoard();
    sb.json("note", "add", "plan", "Onboarding", "--step", "Header", "--step", "List");
    sb.json("note", "add", "plan", "Spec", "--file", "SPEC.md");
    sb.json("note", "step", "APP-N1", "1", "--done");
    const brief = sb.board("context").out;
    expect(brief).toContain("Plans:\n  APP-N1 Onboarding — step 2 of 2: List");
    expect(brief).not.toContain("APP-N2 Spec —");
  });

  it("only a plan has steps", () => {
    const sb = withBoard();
    expect(sb.board("note", "add", "brainstorm", "Names", "--step", "x").err).toContain("only for plans");
    sb.json("note", "add", "decision", "Dark");
    expect(sb.board("note", "step", "APP-N1", "x").err).toContain("only a plan has steps");
    sb.json("note", "add", "plan", "P", "--step", "a");
    expect(sb.board("note", "update", "APP-N2", "--kind", "brainstorm").err).toContain("only a plan has steps");
  });

  it("a merged card's plan steps follow it; a deleted one's let go", () => {
    const sb = withBoard();
    sb.json("add", "A");
    sb.json("add", "B");
    sb.json("note", "add", "plan", "P", "--step", "one", "--step", "two");
    sb.json("note", "step", "APP-N1", "1", "--card", "APP-1");
    sb.json("note", "step", "APP-N1", "2", "--card", "APP-2");
    sb.json("merge", "APP-1", "--into", "APP-2");
    let n = sb.json("note", "show", "APP-N1");
    expect(n.steps.map((s: any) => s.card)).toEqual(["APP-2", "APP-2"]);
    expect(n.cards).toEqual(["APP-2"]);
    sb.json("delete", "APP-2");
    n = sb.json("note", "show", "APP-N1");
    expect(n.steps.map((s: any) => s.card)).toEqual(["", ""]);
    expect(validateBoard(sb.read())).toEqual([]);
  });

  it("migrates v5 boards: every note gets an empty step list", () => {
    const v5 = { schemaVersion: 5, notes: [{ id: "APP-N1", kind: "plan" }] };
    const { board } = migrate(v5);
    expect(board.schemaVersion).toBe(SCHEMA_VERSION);
    expect((board.notes as any[])[0].steps).toEqual([]);
  });

  it("the board page adds, ticks and links steps through the API", () => {
    const sb = withBoard();
    const id = projectId(sb.root);
    sb.json("add", "The list");
    const n = api(sb, "POST", `/api/projects/${id}/notes`, { kind: "plan", title: "Plan", steps: ["a", "b"] });
    expect(n.steps).toHaveLength(2);
    api(sb, "PATCH", `/api/projects/${id}/notes/${n.id}`, { step: { add: "c" } });
    api(sb, "PATCH", `/api/projects/${id}/notes/${n.id}`, { step: { n: 1, done: true } });
    const after = api(sb, "PATCH", `/api/projects/${id}/notes/${n.id}`, { step: { n: 2, card: "APP-1" } });
    expect(after.steps.map((s: any) => [s.text, s.done, s.card])).toEqual([["a", true, ""], ["b", false, "APP-1"], ["c", false, ""]]);
    const removed = api(sb, "PATCH", `/api/projects/${id}/notes/${n.id}`, { step: { n: 3, remove: true } });
    expect(removed.steps).toHaveLength(2);
    expect(removed.updatedBy).toBe("user");
  });
});
