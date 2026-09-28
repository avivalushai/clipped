import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { IDLE_CAP_MS, readSessionFile, sessionStats } from "../../server/src/sessions.js";
import { listen } from "../../server/src/server.js";
import { projectId } from "../../server/src/projects.js";
import { type Sandbox, sandbox, withBoard } from "./helpers.js";

const MIN = 60_000;
const T0 = Date.parse("2026-09-01T10:00:00.000Z");

/** A fake Claude Code session log: one entry per offset (in minutes from T0). */
function session(sb: Sandbox, name: string, cwd: string, minutes: number[]) {
  const dir = path.join(sb.env.CLIPPED_CLAUDE_HOME!, "projects", cwd.replace(/\//g, "-"));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.jsonl`);
  fs.writeFileSync(file, lines(cwd, minutes));
  return file;
}
const lines = (cwd: string, minutes: number[]) =>
  minutes.map((m) => JSON.stringify({ type: "user", cwd, timestamp: new Date(T0 + m * MIN).toISOString(), message: { content: "hé ✓" } }) + "\n").join("");

const withClaude = (sb = sandbox()) => {
  sb.env.CLIPPED_CLAUDE_HOME = path.join(sb.home, "claude");
  return sb;
};
const ctxOf = (sb: Sandbox) => ({ cwd: sb.root, env: sb.env, out: () => {}, err: () => {} });

describe("session stats from Claude Code's logs", () => {
  it("counts active time with long gaps capped, and open time first to last", () => {
    const sb = withClaude();
    // 0 → 2 → 4 min of work, then an hour away, then 1 more minute
    const f = session(sb, "a", sb.root, [0, 2, 4, 64, 65]);
    const s = readSessionFile(f)!;
    expect(s.cwd).toBe(sb.root);
    expect(s.activeMs).toBe(4 * MIN + IDLE_CAP_MS + 1 * MIN);
    expect(s.lastAt - s.firstAt).toBe(65 * MIN);
  });

  it("sums sessions per project, deepest project wins, strangers are left out", () => {
    const sb = withClaude();
    const inner = path.join(sb.root, "packages", "app");
    session(sb, "a", sb.root, [0, 1]);
    session(sb, "b", path.join(sb.root, "docs"), [0, 3]);
    session(sb, "c", inner, [0, 2]);
    session(sb, "d", "/somewhere/else", [0, 10]);
    const m = sessionStats(ctxOf(sb), [sb.root, inner]);
    expect(m.get(sb.root)).toMatchObject({ sessions: 2, activeMs: 4 * MIN, openMs: 4 * MIN });
    expect(m.get(inner)).toMatchObject({ sessions: 1, activeMs: 2 * MIN });
    expect(m.get(sb.root)!.lastAt).toBe(new Date(T0 + 3 * MIN).toISOString());
  });

  it("picks up lines appended since the last read, and waits for an unfinished one", () => {
    const sb = withClaude();
    const f = session(sb, "a", sb.root, [0, 1]);
    expect(sessionStats(ctxOf(sb), [sb.root]).get(sb.root)!.activeMs).toBe(1 * MIN);
    const more = lines(sb.root, [3]);
    fs.appendFileSync(f, more.slice(0, 20)); // half a line
    fs.utimesSync(f, new Date(), new Date(Date.now() + 1000));
    expect(sessionStats(ctxOf(sb), [sb.root]).get(sb.root)!.activeMs).toBe(1 * MIN);
    fs.appendFileSync(f, more.slice(20));
    fs.utimesSync(f, new Date(), new Date(Date.now() + 2000));
    expect(sessionStats(ctxOf(sb), [sb.root]).get(sb.root)).toMatchObject({ activeMs: 3 * MIN, openMs: 3 * MIN });
  });

  it("gives zeros when there are no logs at all", () => {
    const sb = withClaude();
    expect(sessionStats(ctxOf(sb), [sb.root]).get(sb.root)).toEqual({ sessions: 0, activeMs: 0, openMs: 0, lastAt: null });
  });

  it("GET /api/stats returns them per project", async () => {
    const sb = withClaude(withBoard());
    session(sb, "a", sb.root, [0, 2]);
    const { server, url } = await listen(ctxOf(sb), 0);
    try {
      const body = await (await fetch(url + "/api/stats")).json();
      expect(body).toEqual([{ id: projectId(sb.root), sessions: 1, activeMs: 2 * MIN, openMs: 2 * MIN, lastAt: new Date(T0 + 2 * MIN).toISOString() }]);
    } finally {
      server.close();
    }
  });
});
