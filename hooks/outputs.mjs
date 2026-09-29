#!/usr/bin/env node
// Stop: when Claude's reply points at something it made that you can open — an app
// running on localhost, a deployed site, a pull request, an artifact — attach the link
// to the card being worked on. It shows in the Outputs tab and as a button on the card.
//
// Only links to things that were made, not every URL a reply mentions: docs and
// search results stay out. The board itself (clipped.localhost, :4747) never counts.
import { board, findBoardFile, safely } from "./lib.mjs";

const MADE = [
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|[\w-]+\.localhost)(:\d+)?(\/|$)/i, // an app running here
  /^https:\/\/[\w.-]+\.(vercel\.app|netlify\.app|pages\.dev|fly\.dev|onrender\.com|herokuapp\.com|github\.io|web\.app|firebaseapp\.com)(\/|$)/i, // a deploy
  /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/i, // a pull request
  /^https:\/\/claude\.ai\/(code\/)?artifact\//i, // an artifact
];
const BOARD = /^https?:\/\/(clipped\.localhost|(localhost|127\.0\.0\.1):4747)(\/|:|$)/i;

/** Links to things that were made, in the order they appear, each once. */
export function madeLinks(text) {
  const found = String(text ?? "").match(/https?:\/\/[^\s<>()"'`\]]+/g) ?? [];
  const clean = found.map((u) => u.replace(/[.,;:!?*_]+$/, ""));
  return [...new Set(clean.filter((u) => !BOARD.test(u) && MADE.some((re) => re.test(u))))];
}

safely(async (input) => {
  if (input.stop_hook_active) return;
  const cwd = input.cwd || process.cwd();
  if (!findBoardFile(cwd)) return;
  const links = madeLinks(input.last_assistant_message);
  if (!links.length) return;

  // The card being worked on: the most recently touched one in progress, else in your turn.
  let cards = [];
  try {
    cards = JSON.parse(board(["list", "--status", "active,review", "--json"], cwd) || "[]");
  } catch {
    return;
  }
  const pick = (s) => cards.filter((f) => f.status === s).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  const card = pick("active") ?? pick("review");
  if (!card) return;
  const fresh = links.filter((l) => !(card.links ?? []).includes(l));
  if (!fresh.length) return;
  board(["update", card.key, ...fresh.flatMap((l) => ["--link", l]), "--by", "claude"], cwd);
});
