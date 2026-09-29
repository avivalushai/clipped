import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { handleApi } from "../../server/src/api.js";
import { type Sandbox, sandbox } from "./helpers.js";

const api = (sb: Sandbox, method: string, body?: unknown) =>
  handleApi({ cwd: sb.root, env: sb.env, out: () => {}, err: () => {} }, { method, path: "/api/prefs", body }) as any;

describe("UI prefs kept on this machine", () => {
  it("remembers that Getting started was closed, in ~/.clipped/ui.json", () => {
    const sb = sandbox();
    expect(api(sb, "GET")).toEqual({});
    expect(api(sb, "PATCH", { obHidden: true })).toEqual({ obHidden: true });
    expect(api(sb, "PATCH", { tourDone: true })).toEqual({ obHidden: true, tourDone: true });
    expect(JSON.parse(fs.readFileSync(path.join(sb.home, "ui.json"), "utf8"))).toEqual({ obHidden: true, tourDone: true });
  });

  it("keeps only the known true/false choices", () => {
    const sb = sandbox();
    expect(api(sb, "PATCH", { obHidden: "yes", boardTitle: "secret", tourDone: false })).toEqual({ tourDone: false });
    expect(() => api(sb, "DELETE")).toThrow(/GET or PATCH/);
  });
});
