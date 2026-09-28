#!/usr/bin/env node
// Re-take the landing page screenshots from the real board, at 2x, light and dark.
//
//   board ui --no-open                  # the board must be running on :4747
//   node scripts/shoot-landing.mjs      # writes landing/img/{board,card}{,-light}.png
//
// Drives Chrome over the DevTools protocol, so nothing needs installing.
// Options: --out <dir>  --url <board url>  --chrome <path to a Chrome binary>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : fallback; };
const OUT = path.resolve(arg("out", path.join(repo, "landing/img")));
const URL = arg("url", "http://localhost:4747/");
const CHROME = arg("chrome", [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find((p) => fs.existsSync(p)));
const PORT = 9333;
const SIDE = 232, W = 1208, H = 940;   // board.png: the main area without the sidebar, 1208x940 CSS px
const CW = 480, CH = 685;              // card.png: the top of an open card, 480x685 CSS px
const CARD = "LE-4";                   // the card shown open
const SHOWN_PATH = "~/Projects/clipped"; // the repo's name on GitHub, instead of the local folder

if (!CHROME) { console.error("No Chrome found. Pass --chrome <path>."); process.exit(1); }
try { await fetch(URL); } catch { console.error(`Nothing at ${URL}. Start the board first: board ui --no-open`); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "clipped-shots-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const page = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === "page");
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
  } catch { await sleep(200); }
}
if (!ws) { chrome.kill(); console.error("Chrome did not start."); process.exit(1); }
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  pending.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const js = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`page: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
  return r.result.value;
};

// Open this project's Work tab in Board view.
async function openBoard(theme, height) {
  await send("Emulation.setDeviceMetricsOverride", { width: SIDE + W, height, deviceScaleFactor: 2, mobile: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }, { name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: URL });
  await sleep(1500);
  await js(`(async () => {
    await document.fonts.ready;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const click = (sel, text) => { const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().startsWith(text)); if (!el) throw new Error("no " + sel + " " + text); el.click(); };
    click(".nav-item", "LE"); await wait(400);
    click(".tabs-top button", "Work"); await wait(300);
    click(".tabs button", "Board"); await wait(500);
    for (const el of document.querySelectorAll(".crumb *, .crumb"))
      for (const n of el.childNodes)
        if (n.nodeType === 3 && /\\/[^\\s]*$/.test(n.textContent)) n.textContent = ${JSON.stringify(SHOWN_PATH)};
    document.activeElement?.blur();
  })()`);
  await sleep(400);
}
async function shot(file, clip) {
  const { data } = await send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 } });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(data, "base64"));
  console.log(`${path.relative(process.cwd(), path.join(OUT, file))}`);
}

try {
  await send("Page.enable");
  await send("Runtime.enable");
  for (const [theme, suffix] of [["light", "-light"], ["dark", ""]]) {
    await openBoard(theme, H);
    await shot(`board${suffix}.png`, { x: SIDE, y: 0, width: W, height: H });
    await openBoard(theme, CH);
    await js(`(async () => {
      const card = [...document.querySelectorAll(".card")].find((c) => [...c.querySelectorAll(".meta *")].some((x) => x.textContent.trim() === ${JSON.stringify(CARD)}));
      if (!card) throw new Error("no ${CARD} card on the board");
      card.click(); await new Promise((r) => setTimeout(r, 600));
      document.activeElement?.blur();
      if (!document.querySelector(".drawer")) throw new Error("the card did not open");
    })()`);
    await sleep(300);
    await shot(`card${suffix}.png`, { x: SIDE + W - CW, y: 0, width: CW, height: CH });
  }
} finally {
  ws.close(); chrome.kill();
  await sleep(500);
  fs.rmSync(profile, { recursive: true, force: true });
}
