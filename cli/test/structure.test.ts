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
