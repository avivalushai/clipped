// What counts as a design call in an edit: a color, a typeface or a design token
// that the project's DESIGN.md doesn't already have. Reusing an existing value is
// following the design, not deciding it, so it never counts.

import fs from "node:fs";
import path from "node:path";

const UI_FILE = /\.(css|scss|sass|less|html?|jsx|tsx|vue|svelte|astro)$/i;
const COLOR = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|(?:rgba?|hsla?|oklch|oklab)\([^)]*\)/gi;
const FONT = /font-family\s*:\s*([^;"'}\n]+|["'][^"']+["'])/gi;
const TOKEN = /(?:^|[\s{;])(--[a-z][\w-]*)\s*:/gi;

export const isUiFile = (file) => UI_FILE.test(file);

/** The text an edit added: Write's content, Edit's new_string, each of MultiEdit's. */
export function addedText(toolInput = {}) {
  const parts = [toolInput.content, toolInput.new_string];
  if (Array.isArray(toolInput.edits)) for (const e of toolInput.edits) parts.push(e?.new_string);
  return parts.filter((p) => typeof p === "string").join("\n");
}

export const hasDesignDoc = (root) => fs.existsSync(path.join(root, "DESIGN.md"));

function designDoc(root) {
  try {
    return fs.readFileSync(path.join(root, "DESIGN.md"), "utf8").toLowerCase();
  } catch {
    return "";
  }
}

/** New design values in `text`, as short labels ("color #7d96ff", "font Inter", "token --hover"). */
export function designCalls(text, root) {
  const doc = designDoc(root);
  const known = (v) => doc && doc.includes(v.toLowerCase());
  const found = new Set();
  for (const m of text.matchAll(COLOR)) {
    const v = m[0].replace(/\s+/g, "").toLowerCase();
    if (!known(v)) found.add(`color ${v}`);
  }
  for (const m of text.matchAll(FONT)) {
    const first = m[1].split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (first && !/^(var\(|inherit|system-ui|sans-serif|serif|monospace)/i.test(first) && !known(first)) found.add(`font ${first}`);
  }
  for (const m of text.matchAll(TOKEN)) if (!known(m[1])) found.add(`token ${m[1]}`);
  return [...found];
}
