import { describe, expect, it } from "vitest";
import { areaOf, guessArea } from "../src/areas.js";
import { migrate } from "../src/migrations.js";
import { SCHEMA_VERSION, validateBoard } from "../src/schema.js";
import { withBoard } from "./helpers.js";

describe("areas", () => {
  it("guesses from the first telling folder until one is named", () => {
    expect(guessArea("app/invoices/page.tsx")).toBe("Invoices");
    expect(guessArea("src/components/date-picker/index.tsx")).toBe("Date picker");
    expect(guessArea("ui/index.html")).toBe("UI");
    expect(guessArea("README.md")).toBe("");
  });

  it("files a card by where most of its files are; the most specific path wins", () => {
    const b = {
      areas: [
        { name: "Invoices", paths: ["app/invoices"] },
        { name: "Invoice PDF", paths: ["app/invoices/pdf"] },
      ],
    };
    expect(areaOf(b, { area: "", files: ["app/invoices/pdf/render.ts", "app/invoices/pdf/fonts.ts", "app/invoices/page.tsx"] })).toBe("Invoice PDF");
    expect(areaOf(b, { area: "", files: ["app/invoices/page.tsx"] })).toBe("Invoices");
    expect(areaOf(b, { area: "Invoices", files: ["app/settings/page.tsx"] })).toBe("Invoices");
    expect(areaOf(b, { area: "", files: [] })).toBe("");
  });

  it("names, renames and removes areas through the CLI", () => {
    const sb = withBoard();
    sb.json("area", "add", "Invoices", "--path", "app/invoices");
    sb.json("add", "Totals", "--file", "app/invoices/totals.ts");
    sb.json("add", "Copy tweaks", "--area", "Marketing");
    expect(sb.board("area", "list").out).toContain("Invoices — 1 card · app/invoices");
    expect(sb.board("show", "APP-1").out).toContain("Area: Invoices (from its files)");

    sb.json("area", "rename", "Marketing", "Site");
    expect(sb.read().features[1].area).toBe("Site");
    expect(sb.json("update", "APP-2", "--area", "auto").area).toBe("");
    sb.json("update", "APP-2", "--area", "Site");
    sb.json("area", "rm", "Site");
    expect(sb.read().features[1].area).toBe("");
    expect(sb.board("area", "rm", "Nope").err).toMatch(/no area Nope/);
    expect(validateBoard(sb.read())).toEqual([]);
  });

  it("Claude's guess holds until the card has files; the user's pick always wins", () => {
    const sb = withBoard(); // acts as claude
    sb.json("add", "Dropdowns look like the rest of the board", "--area", "Settings");
    expect(sb.read().features[0].log.at(-1)).toMatchObject({ by: "claude", text: "Area: Settings" });
    expect(sb.board("show", "APP-1").out).toContain("Area: Settings");

    // work starts in ui/: the files outvote the guess
    sb.json("update", "APP-1", "--file", "ui/index.html");
    expect(areaOf(sb.read(), sb.read().features[0])).toBe("UI");

    // the user moves it back: now it sticks, whatever the files say
    sb.json("update", "APP-1", "--area", "Settings", "--by", "user");
    expect(areaOf(sb.read(), sb.read().features[0])).toBe("Settings");
    expect(validateBoard(sb.read())).toEqual([]);
  });

  it("refuses a card in an area the board doesn't have", () => {
    const sb = withBoard();
    sb.json("add", "Totals");
    const b = sb.read();
    b.features[0].area = "Ghost";
    expect(validateBoard(b)).toContain("features[0].area: no area Ghost on this board");
  });
});

describe("schema v4", () => {
  it("migrates a v3 board: cards get no area, the board no areas", () => {
    const sb = withBoard();
    sb.json("add", "Old card");
    const v3 = sb.read();
    delete v3.areas;
    for (const f of v3.features) delete f.area;
    const { board, to } = migrate({ ...v3, schemaVersion: 3 });
    expect(to).toBe(SCHEMA_VERSION);
    expect(board).toMatchObject({ areas: [], features: [{ area: "" }] });
    expect(validateBoard(board)).toEqual([]);
  });
});

describe("the API and areas", () => {
  it("returns the area a card is actually in after an edit, not only after a reload", async () => {
    const { handleApi } = await import("../../server/src/api.js");
    const { projectId } = await import("../../server/src/projects.js");
    const sb = withBoard();
    sb.json("add", "Shortcuts sheet", "--area", "UI");
    const api = (method: string, route: string, body?: unknown) =>
      handleApi({ cwd: sb.root, env: sb.env, out: () => {}, err: () => {} }, { method, path: route, body }) as any;
    const f = api("PATCH", `/api/projects/${projectId(sb.root)}/features/APP-1`, { area: "Shortcuts" });
    expect(f).toMatchObject({ area: "Shortcuts", inArea: "Shortcuts" });
  });
});
