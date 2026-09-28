import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

describe("the landing page", () => {
  // The badge is typed by hand in plain HTML; this is what stops it drifting.
  it("shows the version the plugin actually ships", () => {
    const version = JSON.parse(read("package.json")).version;
    expect(JSON.parse(read(".claude-plugin/plugin.json")).version).toBe(version);
    // The badge has moved between redesigns; look for the version inside the header pill.
    const html = read("landing/index.html");
    const badge = /class="(?:pill|badge)"[\s\S]{0,300}?\bv(\d+\.\d+\.\d+)\b/.exec(html)?.[1];
    expect(badge, "no version badge found in landing/index.html").toBeDefined();
    expect(badge, "landing/index.html's badge doesn't match package.json — update the badge").toBe(version);
  });
});
