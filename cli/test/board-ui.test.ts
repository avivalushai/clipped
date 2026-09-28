import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { sandbox } from "./helpers.js";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bundle = path.join(repo, "bin/board.cjs");

/** A port nothing is listening on right now. */
const freePort = () =>
  new Promise<number>((resolve) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const p = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(p));
    });
  });

const hello = async (port: number) => {
  try {
    return (await (await fetch(`http://127.0.0.1:${port}/api/hello`)).json()) as { app: string; pid: number };
  } catch {
    return null;
  }
};

const started: { home: string; port: number }[] = [];
afterEach(() => {
  // Stop every board a test started, by its own --stop (which kills exactly that pid).
  for (const { home, port } of started.splice(0)) {
    try {
      execFileSync(process.execPath, [bundle, "ui", "--stop", "--port", String(port)], { env: { ...process.env, CLIPPED_HOME: home } });
    } catch {
      /* already gone */
    }
  }
});

describe("board ui", () => {
  // Async on purpose: a fake server in this process must keep answering while board ui probes it.
  const run = promisify(execFile);
  const ui = async (home: string, ...args: string[]) =>
    (await run(process.execPath, [bundle, "ui", "--no-open", ...args], { env: { ...process.env, CLIPPED_HOME: home }, encoding: "utf8" })).stdout;

  it("starts the board in the background, reuses it on the next run, and stops it", async () => {
    const sb = sandbox();
    const port = await freePort();
    started.push({ home: sb.home, port });

    const first = await ui(sb.home, "--port", String(port));
    expect(first).toContain(`Clipped → http://clipped.localhost:${port}`);
    expect(first).toContain("runs in the background");
    const running = await hello(port);
    expect(running?.app).toBe("clipped");

    // A second run opens the same board — same port, same process — instead of starting another.
    const second = await ui(sb.home, "--port", String(port));
    expect(second).toContain(`http://clipped.localhost:${port}`);
    expect(second).toContain("already running");
    expect((await hello(port))?.pid).toBe(running!.pid);

    expect(await ui(sb.home, "--stop", "--port", String(port))).toContain(`Stopped the board on ${port}`);
    await new Promise((r) => setTimeout(r, 200));
    expect(await hello(port)).toBeNull();
  }, 20_000);

  it("reuses a board from an older version (no /api/hello) instead of moving to another port", async () => {
    const sb = sandbox();
    const port = await freePort();
    const old = http.createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/api/projects") return res.end("[]");
      res.statusCode = 404;
      res.end('{"error":"no route"}');
    }).listen(port, "127.0.0.1");
    await new Promise((r) => old.once("listening", r));
    try {
      const out = await ui(sb.home, "--port", String(port));
      expect(out).toContain(`http://clipped.localhost:${port}`);
      expect(out).toContain("already running");
      expect(fs.existsSync(path.join(sb.home, "settings.json")) && JSON.parse(fs.readFileSync(path.join(sb.home, "settings.json"), "utf8")).port).toBeFalsy();
    } finally {
      old.close();
    }
  }, 20_000);

  it("steps past a port another app holds, and remembers the one it took", async () => {
    const sb = sandbox();
    const taken = await freePort();
    const other = http.createServer((_, res) => res.end("not clipped")).listen(taken, "127.0.0.1");
    await new Promise((r) => other.once("listening", r));
    try {
      // No --port: the saved/default port is used, so point the default at the taken one via settings.
      fs.mkdirSync(sb.home, { recursive: true });
      fs.writeFileSync(path.join(sb.home, "settings.json"), JSON.stringify({ installId: "t", telemetry: false, port: taken }));
      const out = await ui(sb.home);
      const port = Number(/clipped\.localhost:(\d+)/.exec(out)?.[1]);
      started.push({ home: sb.home, port });
      expect(port).toBeGreaterThan(taken);
      expect((await hello(port))?.app).toBe("clipped");
      expect(JSON.parse(fs.readFileSync(path.join(sb.home, "settings.json"), "utf8")).port).toBe(port);
    } finally {
      other.close();
    }
  }, 20_000);
});
