# Design variants

Designs Claude produced that didn't ship as they are. They were rebuilt from the Claude Code transcripts on 2026-09-29. See "Designs Claude generated" in [../decisions.md](../decisions.md) for how each was recovered, and what's lost.

| File | What it is | Date |
|---|---|---|
| `landing-v2-first-remix.html` | The first Notion/Cursor/Clerk/Cal remix: centred hero, "Never lose what you ___" rotating word, tabbed install box | 2026-09-28 |
| `landing-v2-copy-switcher.html` | v2 on one 3-column grid, with a bottom bar that switches copy (`?copy=story`, `sharp`, `short`) | 2026-09-28 |
| `landing-v3-combined-hero.html` | The user's combination: new title with the word in a chip, and the original page's example board | 2026-09-28 |
| `landing-v4-title-switcher.html` | v4 before a title was chosen, with an A–D switcher (`?title=b`) | 2026-09-28 |
| `install-guide-unused.html` | An install guide written in parallel with the one that shipped | 2026-09-27 |

To view one, open it in a browser. Images and the video point at `landing/`, so serve from the repo root:

```bash
python3 -m http.server 4802
```

Then open `http://localhost:4802/docs/design-variants/<file>`.
