import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { run } from "../src/cli.js";
import { findNewerCli } from "../src/handoff.js";
import { SCHEMA_VERSION } from "../src/schema.js";
import { VERSION } from "../src/version.js";
import { withBoard } from "./helpers.js";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** A fake plugin cache: .../clipped/<version>/bin/board.cjs for each version. */
function cache(versions: Record<string, string>) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "le-cache-")));
  for (const [v, body] of Object.entries(versions)) {
    fs.mkdirSync(path.join(dir, v, "bin"), { recursive: true });
    fs.writeFileSync(path.join(dir, v, "bin", "board.cjs"), body);
  }
  return (v: string) => path.join(dir, v, "bin", "board.cjs");
}

// A session that started before a plugin update keeps the old CLI; another
// session can upgrade the board meanwhile. The old CLI must not block the work.
describe("handing off to a newer installed CLI", () => {
  it("picks the newest version above its own, by semver", () => {
    const at = cache({ "0.9.2": "", "0.9.10": "", "0.10.0": "", "0.8.9": "", junk: "" });
    expect(findNewerCli(at("0.9.2"), "0.9.2")).toBe(at("0.10.0"));
    expect(findNewerCli(at("0.10.0"), "0.10.0")).toBeUndefined();
    expect(findNewerCli("/nowhere/0.1.0/bin/board.cjs", "0.1.0")).toBeUndefined();
  });

  it("hands off only when the board is newer, and returns the new CLI's exit code", () => {
    const sb = withBoard();
    let calls = 0;
    const go = () =>
      run(["list"], { cwd: sb.root, env: sb.env, out: () => {}, err: () => {}, handoff: () => (calls++, 7) });
    expect(go()).toBe(0);
    expect(calls).toBe(0);

    sb.write({ ...sb.read(), schemaVersion: SCHEMA_VERSION + 1 });
    expect(go()).toBe(7);
    expect(calls).toBe(1);
    expect(sb.read().schemaVersion).toBe(SCHEMA_VERSION + 1);
  });

  it("the bundle runs the newer CLI end to end", () => {
    const at = cache({
      [VERSION]: fs.readFileSync(path.join(repo, "bin/board.cjs"), "utf8"),
      "99.0.0": 'console.log("newer:" + process.argv.slice(2).join(" ") + ":" + process.env.CLIPPED_HANDED_OFF)',
    });
    const sb = withBoard();
    sb.write({ ...sb.read(), schemaVersion: SCHEMA_VERSION + 1 });
    const out = execFileSync(process.execPath, [at(VERSION), "list", "--json"], {
      cwd: sb.root,
      env: { ...process.env, ...sb.env, CLIPPED_HANDED_OFF: "" },
      encoding: "utf8",
    });
    expect(out.trim()).toBe("newer:list --json:1");
  });
});
