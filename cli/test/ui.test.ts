import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const html = fs.readFileSync(path.join(repo, "ui/index.html"), "utf8");
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";

describe("the bundled UI", () => {
  it("is one self-contained page with valid script", () => {
    expect(html).toContain("<title>Clipped");
    expect(script.length).toBeGreaterThan(10_000);
    expect(() => new vm.Script(script)).not.toThrow();
    // no build step, no CDN: the server serves this file as-is
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/https?:\/\/(cdn|unpkg|jsdelivr)/);
  });

  it("keeps board data in the API and only view prefs in the browser", () => {
    expect(script).toContain("/api/projects");
    expect(script).toContain("/api/events");
    for (const write of script.match(/localStorage\.\w+\([^)]*\)/g) ?? []) expect(write).toContain("prefs");
    expect(script).not.toContain("function sample(");
  });

  it("writes every change through the API, never straight to state", () => {
    for (const call of ["method:'POST'", "method:'PATCH'", "method:'DELETE'"]) expect(script).toContain(call);
    expect(script).toContain("EventSource");
  });

  it("explains itself when the local server isn't running", () => {
    expect(script).toContain("No local server");
    expect(script).toContain("board ui");
  });

  it("keeps ideas out of the progress figure and collapsed by default", () => {
    // A brainstorm should never make the project look like it went backwards.
    expect(script).toContain("const committed=fs=>fs.filter(f=>f.status!=='idea')");
    expect(script).toContain("collapsed:['idea']");
    expect(script).toContain("data-grp=");
  });

  it("opens a card on a row click, without stealing clicks meant for editing", () => {
    expect(script).toContain("addEventListener('click'");
    expect(script).toContain("if(e.target.closest('input,select,button,textarea,label,a')) return;");
    expect(script).not.toContain("addEventListener('dblclick'");
  });

  it("shows row cells as text, and edits one only from its pencil", () => {
    // a click anywhere else on the row opens the panel
    expect(script).toContain("function editableCell(");
    expect(script).toContain('data-editcell=');
    expect(script).toContain("editCell===id+'|'+k");
    for (const k of ["k:'title',attr:'data-edit'", "k:'note',attr:'data-edit'", "k:'title',attr:'data-nedit'", "k:f.k,attr:'data-nedit'"])
      expect(script).toContain(k);
    // a re-render leaves the field unfocused, so a click outside has to close it too
    expect(script).toContain("addEventListener('mousedown'");
    expect(script).toContain("if(editCell){");
  });

  it("grows a drawer's text box to fit its text", () => {
    expect(script).toContain("function fitText(el)");
    expect((script.match(/fitDrawerText\(\);/g) ?? []).length).toBe(2);
  });

  it("gives a note its own panel instead of the card one", () => {
    // A note has no status, no steps and no progress: the card drawer's fields
    // would all be empty, which is why notes had no panel at all before.
    expect(script).toContain("function renderNoteDrawer(){");
    expect(script).toContain("if(openNote) return renderNoteDrawer();");
    expect(script).toContain("data-nopen=");
    for (const field of ["What was decided", "What it produced", "Where it came from"])
      expect(script).toContain(field);
    // both directions: a note lists the cards it produced, a card names its source
    expect(script).toContain("const noteCards=n=>n.cards.map(");
    expect(script).toContain("function sourceNotes(f){");
    expect(script).toContain("data-gocard=");
  });

  it("stops asking a question the things it only asks a feature", () => {
    expect(script).toContain("const isQ=f.type==='question'");
    // no progress bar and no empty file list on a question
    expect(script).toContain("${isQ?'':progBar(f)}");
    expect(script).toContain("${isQ&&!f.files.length?'':`<div class=\"field\"><span class=\"lbl\">Files touched");
    // and it records an answer rather than deciding
    expect(script).toContain("that marks it Answered, not Decided");
  });

  it("tells the user how to add a project instead of faking one", () => {
    expect(script).toContain("board init");
    expect(script).not.toContain("S.projects.push(");
  });
});
