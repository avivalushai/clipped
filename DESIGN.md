---
version: alpha
name: Clipped
description: Local feature board for Claude Code (ui/index.html) and its marketing site (landing/index.html, landing/install.html). Values below are the board's light theme; dark values are in the Themes table.
colors:
  ground: "#F7F7F4"
  surface: "#FFFFFF"
  sunk: "#F1F1ED"
  ink: "#1D1C18"
  muted: "#6B6A63"
  faint: "#75736B"
  line: "rgba(29,28,24,.10)"
  line-2: "rgba(29,28,24,.16)"
  grid: "rgba(20,35,70,.06)"
  accent: "#2F5BFF"
  accent-ink: "#FFFFFF"
  focus: "#2F5BFF"
  side: "#F1F1ED"
  side-ink: "#1D1C18"
  side-muted: "#6B6A63"
  side-hover: "rgba(29,28,24,.05)"
  side-active: "#FFFFFF"
  side-line: "rgba(29,28,24,.08)"
  s-idea: "#8A887F"
  s-active: "#0E9FC2"
  s-parked: "#D9831F"
  s-review: "#7C5CF0"
  s-done: "#1FA56B"
  parked-bg: "#FDF3E6"
  parked-line: "#E9B677"
  danger: "#D6402B"
typography:
  display:
    fontFamily: Geist
  sans:
    fontFamily: Geist
  mono:
    fontFamily: Geist Mono
rounded:
  card: 14px
  panel: 16px
  ctl: 10px
spacing:
  page: 1200px
  gutter: 24px
  gap: 16px
  section: 88px
  vis: 248px
---

# Clipped design

## Overview

Clipped is a Claude Code plugin whose visible surface is a local board at `clipped.localhost:4747` (`ui/index.html`, served by `server/src/server.ts:79`) plus a static marketing site (`landing/index.html`, `landing/install.html`). The board is a dense work tool: a table-first tracker with a Board and Timeline view, a right-hand drawer per card, and a light sidebar. The landing site sells it with the same palette and type at a larger scale.

Direction evidenced in source: warm off-white neutrals, one blue accent, five status hues, Geist throughout, a faint 32px blueprint grid fading out behind the top of both surfaces (`ui/index.html:52`, `landing/index.html:69`). The board's own comment states the intent: "Same tokens as the landing page, so the product and the site look like one thing" (`ui/index.html:11`). `.impeccable/config.json` records Geist as a user decision ("keep Geist so the product matches the landing page").

`prototype/loose-ends.html` is the older navy/Bricolage/IBM Plex prototype. It is not the shipped look. See Inconsistencies.

File:line citations refer to commit `1616f96`. A sixth "Decisions" tab is uncommitted work in this worktree and is not described here.

## Colors

Tokens are declared in `ui/index.html:12-26` (light), `:28-38` (dark via `prefers-color-scheme`), `:40-49` (dark via `[data-theme="dark"]`). The landing pages declare their own copy at `landing/index.html:13-58` (identical block in `landing/install.html:13-58`).

| Token | Role |
|---|---|
| `ground` | Page background; field backgrounds inside the drawer; group-header rows |
| `surface` | Tables, cards, drawer, dialog, menus, buttons |
| `sunk` | Hover fill, board columns, tab-strip track, progress track |
| `ink` | Body text; also the selected fill of chips/segmented buttons and the toast background (inverted with `surface`) |
| `muted` | Secondary text, notes, counts |
| `faint` | Mono labels (`th`, `.lbl`, `.nav-label`), timestamps, placeholders |
| `line` / `line-2` | Hairlines / control borders. `line-2` is the border on buttons, inputs, pills |
| `grid` | The 32px blueprint grid behind the header |
| `accent` | Primary buttons, links, focus, "new" dots, Claude's avatar, selected tab count, "now" line |
| `accent-ink` | Text on `accent` |
| `focus` | Global focus outline. Always equals `accent` |
| `side*` | Sidebar surface. In light it matches `sunk`; the current project is a raised `side-active` pill |
| `s-idea` … `s-done` | Status hues for dots, pill text, pill tints (`color-mix` 14–16% on transparent), timeline bars |
| `parked-bg` / `parked-line` | Parked is the only status with its own surface: amber tint + **dashed** border on pills, cards, the note field |
| `danger` | Text of destructive buttons only; never a fill |

Derived colors are computed with `color-mix(in srgb, …)`, not tokens: accent 6% on surface (hand-off box, composer row, bulk bar), accent 18% focus ring, review 7% (verdict box).

Project badges use a separate hard-coded rotation in JS, `PCOLORS` (`ui/index.html:597`): `#2F5BFF #0B93B5 #E0561F #7B5CE0 #1E9E68 #C2367A #4B6A8F`, white text.

**Do the board and landing share a palette?** Yes in value, no in file. The landing page carries the same neutrals, accent and status hues under different names (`bg`=`ground`, `inset`=`sunk`, `active`=`s-active`, etc.), with slightly lighter hairlines (light `line` .08/`line-2` .14 vs the board's .10/.16; dark .07/.13 vs .08/.14). It adds `term-bg #16161a`/`#0a0a0c`, `term-ink #d6d6dc`, `term-dim #85858f` for terminal mock-ups, and has no `side*`, `parked-bg`, `danger`, `accent-ink` or `focus`.

## Themes

The installed DESIGN.md spec has no theme syntax, so frontmatter holds light values and dark values live here.

| Token | Light | Dark |
|---|---|---|
| ground | `#F7F7F4` | `#0E0E10` |
| surface | `#FFFFFF` | `#17171A` |
| sunk | `#F1F1ED` | `#1E1E22` |
| ink | `#1D1C18` | `#ECEBE6` |
| muted | `#6B6A63` | `#9B9A94` |
| faint | `#75736B` | `#8A8984` |
| line | `rgba(29,28,24,.10)` | `rgba(255,255,255,.08)` |
| line-2 | `rgba(29,28,24,.16)` | `rgba(255,255,255,.14)` |
| grid | `rgb(20 35 70 / .06)` | `rgb(255 255 255 / .045)` |
| accent / focus | `#2F5BFF` | `#7D96FF` |
| accent-ink | `#FFFFFF` | `#0E0E10` |
| side | `#F1F1ED` | `#121214` |
| side-ink | `#1D1C18` | `#ECEBE6` |
| side-muted | `#6B6A63` | `#9B9A94` |
| side-hover | `rgba(29,28,24,.05)` | `rgba(255,255,255,.05)` |
| side-active | `#FFFFFF` | `#1E1E22` |
| side-line | `rgba(29,28,24,.08)` | `rgba(255,255,255,.07)` |
| s-idea | `#8A887F` | `#8A8984` |
| s-active | `#0E9FC2` | `#2CC1E4` |
| s-parked | `#D9831F` | `#F3A64C` |
| s-review | `#7C5CF0` | `#A88BFF` |
| s-done | `#1FA56B` | `#3FD08F` |
| parked-bg | `#FDF3E6` | `#231A0E` |
| parked-line | `#E9B677` | `#6B4C1C` |
| danger | `#D6402B` | `#FF7A66` |
| shadow | `0 1px 2px rgba(29,28,24,.05), 0 2px 8px -2px rgba(29,28,24,.06)` | `0 1px 2px rgba(0,0,0,.3)` |
| shadow-lg | `0 1px 2px rgba(29,28,24,.05), 0 24px 48px -16px rgba(29,28,24,.22)` | `0 1px 2px rgba(0,0,0,.3), 0 24px 48px -16px rgba(0,0,0,.6)` |

Theme selection: the board follows the OS only. Its CSS honours `data-theme`, but nothing in the board sets it. The landing pages add a sun/moon toggle that writes `localStorage["clipped.theme"]` (`landing/index.html:762-766`); that choice does not reach the board (different origin).

## Typography

Families (`ui/index.html:9,21-23`; `landing/index.html:11,26-27`): **Geist** 400/500/600 and **Geist Mono** 400/500 from Google Fonts. `--display` and `--sans` are both Geist; the split exists only as a hook. No weight above 600 is loaded or used.

Board (`body` 14px / 1.45, `ui/index.html:51`):

| Role | Family | Size | Weight | Line height / tracking | Where |
|---|---|---|---|---|---|
| Page title `h1` | display | 32px (25px ≤760px) | 500 | 1.1 / -.035em | Project name (editable input), "All work" |
| Drawer title | display | 22px | 500 | 1.25 / -.01em | `.title-in`, wraps to 3 lines then scrolls |
| Stat number | display | 20px | 500 | – / -.02em, tabular | Summary strip |
| Section `h2` | display | 17px | 500 | – / -.01em | Section heads |
| Brand | display | 16px | 600 | – / -.01em | Sidebar "Clipped" |
| Body | sans | 14px | 400; 500 for titles/buttons | 1.45 | Everything by default |
| Small body | sans | 13px, 12.5px | 400 | – | Notes, chips, toolbar pills, toast, log |
| Meta | sans/mono | 12px | 400 | – | Crumbs, hints, keys, ages |
| Label | mono | 11px | 500 | uppercase, .06em | `th`, `.lbl`, `.nav-label`, menu headings |
| Status pill | mono | 11px | 500 | uppercase, .04em | `.status` |
| Badge | mono | 10px (9px small) | 600 | – | `.pkey` project keys |

Numbers that change (counts, %, ages) use `font-variant-numeric: tabular-nums`.

Landing (`body` 16px / 1.55, `landing/index.html:65`): `h1` clamp(40px, 4.4vw, 56px) 500, 1.08, -.045em (31px ≤480px); `h2` clamp(30px, 3.8vw, 46px) 500, 1.08, -.035em; `h3` 16.5px 500; lede clamp(17px, 1.5vw, 19px) muted; section intro 17px; card text 15px; eyebrow mono 12px, sentence case, with a 6px accent square; `.big` stat 64px -.05em. Headlines use `text-wrap: balance`, paragraphs `pretty`. Landing never goes above weight 600.

## Layout

**Board shell** (`ui/index.html:59`): CSS grid `232px | minmax(0,1fr)`. Main padding 26px top, 60px bottom, 28px sides (16px ≤760px). Sections are 32px apart.

**Sidebar**: sticky, full height, padding 18px 10px, 16px gap. Items are a 22px badge + name + parked pip, with a 3px progress bar under the name. At ≤760px, or when folded by hand (`.app.side-shut`), it becomes a 64px icon rail. On a narrow screen a 7px amber dot marks projects with parked work.

**Header**: title block left, toolbar right (search, `board.json`, primary "+ New card"), wrapping with 16px gap. Under it a tab row: section tabs on the left (Work · Questions · Brainstorms · Plans · References, each with a mono count), the view switch on the right (Table · Board · Timeline; Questions has no Timeline; note tabs have no view switch).

**Summary strip**: % done, "N waiting on you" (review-coloured, filters on click), new-since-you-looked, then one dot+count per status. Then status filter chips, then a right-aligned view bar of 32px pill dropdowns (Group by, Density, Columns, Areas, Hide done).

**Table**: a spreadsheet in a `panel`-radius box with its own scroll area (`max-height: calc(100vh - 24px)`) so the header sticks with plain CSS. `table-layout: fixed`, min-width 1080px, vertical cell rules, resizable columns (10px grab zone, 2px accent bar on drag). Rows are 44px (comfortable) or 34px (compact). Group rows sit on `ground`, 12.5px/600 muted, with a rotating chevron. A composer row pins to the top, tinted accent 6% with a 2px accent-mix bottom border. Parked rows get a 3px inset amber stripe on the first cell; done titles are struck through in `muted`.

**Board**: five columns, `repeat(5, minmax(220px,1fr))`, 12px gap, min-width 1150px, horizontal scroll. Columns are `sunk` panels, min 240px tall (120px when empty, header only). Cards: `surface`, 12px 14px padding, `card` radius, `shadow`, note clamped to 3 lines.

**Timeline**: 280px label column + day grid, 40px rows, last 14 days. Bars are 16px, radius 5px, in status colour. Parked idle time is a 2px dashed amber line with a label; review wait uses the review colour; ideas are hollow 10px dots; "now" is a 2px accent line at 60% opacity. There is a legend and a one-line explanation under it.

**Drawer**: fixed right, `min(480px,100%)`, full height, `shadow-lg`, over a `rgba(20,19,16,.28)` scrim. Header 14px 20px 12px; body 16px 20px 24px with 20px between fields. Safe-area insets are respected. Field order for a card: verdict (review only), Status segmented buttons, note, structure, Proof, Steps, hand-off box, Files touched, Where it came from, Activity, footer (Delete + autosave notice).

**Landing** (`landing/index.html`): `.wrap` max `page + 2×gutter` = 1248px; gutter 24px (16px ≤600px). Sections are `section` apart: 88px, then 72px ≤860px, then 64px ≤600px. The grid is three equal columns with `gap` 16px, one column ≤860px. Page order: sticky blurred header (60px) → hero (1.2fr/.8fr split, rotating-word `h1`, tabbed install box, example-board peek) → video stage → Problem (story steps) → How it works → What we catch → The board (text + screenshot) → What it is, and isn't → FAQ → final CTA stage → footer. `install.html` reuses the same system as a guide: 220px sticky TOC with an accent left-rule on the current item, and 800px-max sections separated by hairlines.

## Elevation & Depth

Depth comes mostly from tone and hairlines. The two named shadows are the whole scale: `shadow` for resting surfaces (table box, cards, sidebar current item) and `shadow-lg` for anything floating (drawer, dialog, menus, select pickers, toast). In dark mode `shadow` drops to a 1px contact shadow. Selected tabs and the current sidebar item use a literal `0 1px 2px rgba(0,0,0,.06), 0 0 0 1px var(--line)` ring. Stacking: sticky `th` z 4, menus z 10, scrim 20, drawer 21, toast 40.

Landing adds big soft drop shadows on screenshot windows (`0 30px 60px -20px rgba(0,0,0,.25)`) and three blurred radial status-colour washes behind "stage" frames (`landing/index.html:180-184`). This is the only gradient decoration in the product, and it appears only on landing.

## Shapes

Three named radii: `ctl` 10px (sidebar items, drawer fields), `card` 14px (cards, hand-off, verdict, bulk bar), `panel` 16px (table, board columns, timeline, dialog). Anything that is a button, tab, chip, filter or toolbar control is a full pill (`999px`/`99px`). Small inline things use 5–6px (status pill, badges, inline inputs, checklist rows); menus use 12px.

Landing radii are literal: 20px outer cards with 14px inner panels (8px inset), 24px stages, 14px command boxes and windows, 12px bubbles and mini-UIs.

## Components

**Buttons** (`ui/index.html:127-133`). The pill shape (7px 14px, 500 weight, `line-2` border on `surface`) is the default. Variants:
- `primary`: `accent` fill, `accent-ink` text, and one per view: "+ New card", "Add card", "Park with this note", "Looks good — Done", "Copy prompt".
- `ghost`: transparent.
- `sm`: 4px 11px, 12.5px.
- `danger`: `danger` text only, always paired with `ghost`.

On hover a plain button's border goes to `faint` and a primary button gets `brightness(1.07)`. Transition is .15s on border and background. Text-link buttons (`.linkbtn`, `.keybtn`, `.waiting`, `.fresh`) underline on hover.

**Tabs / segmented** (`:147-156`): a pill track on `sunk`, 3px padding, with buttons at 5px 13px. The selected button (`aria-pressed="true"`) is raised on `surface` with a hairline ring. Section tabs scroll horizontally with the scrollbar hidden.

**Chips** (`:376-378`): status filters, 4px 11px pills on `surface` with a leading status dot and a mono count at .75 opacity. When pressed they invert to `ink` fill and `surface` text. The drawer's Status control (`.seg`) uses the same inversion.

**Status pill** (`:195-200`): mono 11px uppercase on a 14–16% tint of the status colour, radius 6px. Parked alone uses `parked-bg` and a dashed `parked-line` border. In the table the pill is a native `<select>` with a masked chevron. Hover adds a 1px `currentColor` 35% ring; focus adds a 3px `currentColor` 25% ring.

**Dropdowns**: toolbar selects are wrapped in 32px `.opt` pills with one chevron (`--chev` mask). On hover the border goes to ink 28%; on focus it gets an `accent` border plus a 3px accent-18% ring. The Columns and Areas menus are `<details>` popovers: `surface`, 12px radius, `shadow-lg`, 5px padding, a mono uppercase caption, 7px 10px rows. Where `appearance: base-select` is supported (`:514-531`), native selects open as the same menu, with a status-coloured dot before each status option and an accent checkmark.

**Rows**: hover fills with `sunk`. Actions revealed on hover (edit pencil, copy-prompt) rest at opacity 0, show at .6–.75 on row hover, and go to 1 with accent colour on their own hover or focus. Row checkboxes rest at .35 until hover or checked. When rows are selected a bulk bar appears (accent 6% fill, accent 45% border): "N selected", Mark done, Move to, Delete, Clear.

**Cards** (board): a parked card takes the parked surface with a dashed border. The note gets a coloured prefix by status, via CSS `::before`: "Stopped:" (amber) or "Next:" (cyan). While dragging, the card drops to .4 opacity and the target column tints accent 12%.

**Drawer**: see Layout. Fields use mono uppercase `.lbl` labels. Textareas and inputs sit on `ground` with a `line-2` border and `ctl` radius. The parked note field takes the parked surface. Two tinted boxes break up the flow: the **verdict** (review tint), "Your turn / Check it against what's below. Does it work?" with "Looks good — Done" / "Needs work"; and the **hand-off** (accent tint), "Continue with Claude", with a primary button that copies a prompt.

**Dialog**: a native `<dialog>` for the raw `board.json` and hand-off text. `min(640px, 100% - 32px)`, `panel` radius, mono 12px `pre` on `ground`, with Copy / Close.

**Empty states**: one muted sentence in the table or column, padded 20px 16px. It says what belongs there, or how to add it: "Nothing here yet. Add one in the row above."; "No brainstorms yet. Claude adds one when a conversation lands on something worth keeping." An empty board column collapses to its header in `faint`.

**Toast** (`:297,505`, `ui/index.html:791-797`): one at a time, bottom-centre, a pill in `ink` with `surface` text, 13px, `role="status"`. It lasts 1.9s, or 6s when it carries an underlined "Undo".

**Landing-only**: the install box is a `role="tablist"` with Terminal / Claude Code / Ask Claude and 14px-radius command rows with a Copy button. The FAQ is `<details>` rows with a "+" that rotates 45°. The play button is a black pill. Nav CTA "Install" is an `ink` pill.

## Do's and Don'ts

- Don't add keyboard shortcuts beyond `/` (search) and `n` (new). The source says: "Two shortcuts, no more" (`ui/index.html:1673`).
- Don't make the user learn the words "feature" or "ticket" (`skills/clipped/SKILL.md:9`). The data model says features; the UI says **Work** and **card** (`ui/index.html:568`).
- Don't park without a real note. The UI refuses: moving to Parked with an empty note focuses the note and toasts "Say where you stopped, then press Park".

## Motion

| Use | Duration | Easing |
|---|---|---|
| Hover/colour/border transitions (board and landing) | 150ms | `ease` |
| Column-resize grip | 120ms | `ease` |
| Autosave tag, Columns chevron rotate | 200ms | `ease` |
| Select picker open | 140ms (opacity + 4px translate, `@starting-style`) | `ease` |
| Menu open (`menu-in`) | 160ms, from opacity 0, -4px, scale .98 | `cubic-bezier(.2,.8,.2,1)` |
| Search expand (`search-in`) | 180ms, width 32px → 220px | `cubic-bezier(.2,.8,.2,1)` |
| Landing scroll reveal `.rv` | 700ms, 14px rise | opacity `ease`, transform `cubic-bezier(.2,.8,.2,1)` |
| Landing rotating hero word | 500–550ms | `cubic-bezier(.2,.8,.2,1)` |
| Landing story cards untilt, live-dot pulse | 600ms / 2s loop | same curve |

The house curve is `cubic-bezier(.2,.8,.2,1)` for anything that enters; colour changes use `ease`. The drawer, dialog and toast appear and leave without animation.

Reduced motion: the board kills every transition with `*{transition:none!important}` (`ui/index.html:456`) and turns off the two keyframe animations and the picker transition individually (`:142,532`). The landing page opts out per component: reveals are shown immediately, the rotating word and FAQ are static, the live dot pulse becomes a static ring, and smooth scroll is off (`landing/index.html:316-321` and neighbours).

## Voice and copy

- **Status labels** (`ui/index.html:550-552`): Idea · In progress · Parked · **Your turn** · Done. Internally `review` becomes "Your turn" in the UI, "waiting on you" in counts, and "waiting Nd" on the timeline. On the Questions tab the same five statuses read Open · Looking into · Parked · Answered · Decided (`:556`).
- **The note field is relabelled by status**: Next step / Where you stopped / What to check / Next, and for questions: What you're checking / Answer. In lists it gets the prefixes "Next:" / "Stopped:".
- **Buttons say the outcome, in plain words**, sometimes with the result after a dash: "Looks good — Done", "Needs work", "Send back", "Park with this note", "Continue with Claude", "Get the prompt", "Delete card" / "Delete question" (named by object, never a bare "Delete" in the drawer). The page action has a literal "+": "+ New card", "+ New brainstorm".
- **Sentence case everywhere.** Uppercase appears only through CSS on mono labels. The UI never shows a raw status id.
- **Toasts report what happened, in past tense or with an arrow**: "LE-3 → Done", "Deleted 2 cards", "Prompt copied — paste it into Claude", "New dots cleared — no card changed status". Anything reversible gets an Undo.
- **Hints explain the model in one sentence**: "Plans hold the reasoning; the board holds the state. Editing a card never edits the document."
- **Second person, contractions, curly quotes and em dashes** (`’`, `—`).
- **Claude's footer** (SKILL.md §The footer): one line, `Board: LE-3 Save loops → in progress · new idea: LE-15 …`, and nothing else about the board in the reply.
- Landing voice is first person from the maker ("I'd rather you know the limits before you install it") and asks questions as section heads ("How does it actually work?").

## Accessibility

**Contrast** (WCAG 2.x, computed from the tokens):

| Pair | Light | Dark |
|---|---|---|
| ink on ground / surface | 15.89 / 17.05 | 16.16 / 14.99 |
| muted on ground / surface / sunk | 5.06 / 5.43 / 4.80 | 6.84 / 6.34 / 5.89 |
| faint on ground / surface / sunk | 4.43 / 4.75 / **4.19** | 5.50 / 5.10 / 4.74 |
| accent on surface | 5.17 | 6.54 |
| accent-ink on accent | 5.17 | 7.05 |
| danger on surface | 4.54 | 7.01 |
| toast (surface on ink) | 17.05 | 14.99 |
| status pill text on its tint: idea / active / review / done | **3.01 / 2.68 / 3.78 / 2.71** | 4.14 / 6.55 / 5.37 / 6.97 |
| parked pill on parked-bg | **2.65** | 8.46 |
| white on project badge colours | 3.42–5.59 (`#1E9E68` 3.42, `#0B93B5` 3.59, `#E0561F` 3.80 fail) | same |

Light-mode status pills (11px text) fail AA 4.5:1. So do `faint` on `sunk`/`ground` and three of the badge colours. Everything dark passes except the idea pill (4.14).

**Focus**: global `:focus-visible` is a 2px `focus` outline with 2px offset (`ui/index.html:57`; landing `:314`, 6px radius). Form controls swap it for a 3px accent-18% box-shadow ring with an accent border. Status selects use a `currentColor` ring.

**Keyboard**: `/` opens search, `n` opens the composer (ignored while typing or with a drawer open). Esc closes a cell editor, search, composer, drawer. Enter commits a field and Esc reverts it. ⌘/Ctrl+Enter saves in the drawer. Board cards are `tabindex="0" role="button"` and open on Enter/Space. Group rows toggle via the chevron button (`aria-expanded`).

**ARIA**: tab strips and filters are `role="group"` with `aria-pressed` buttons. The sidebar uses `aria-current`. Drawers are `role="dialog" aria-modal="true"` labelled by the card title. The autosave line is `aria-live="polite"`, toasts are `role="status"`, and the bulk bar is `role="region"`. Icon-only buttons have `aria-label`s and decorative SVGs are `aria-hidden`. Landing install tabs use proper `role="tablist"/"tab"` + `aria-selected` + `aria-controls`.

**Gaps verified in code**: the drawer does not move focus into itself on open (except when parking) and has no focus trap, despite `aria-modal`. Deletes use native `confirm()`. Nothing in the board lets the user pick a theme.

## Inconsistencies

1. **`landing/style.css` is orphaned and describes a different design.** No page links it. It uses Schibsted Grotesk / JetBrains Mono, a navy dark-first palette (`--bg #060910`), 8–10px button radii, uppercase accent eyebrows, and comments that claim to be "the board UI's own dark palette". None of that ships.
2. **Three palettes in the repo.** Board and landing agree. `site/app/globals.css` (the Next.js sign-up site) still uses the prototype system: `#EDF1F7`, navy `#0b1220`, IBM Plex + Bricolage, radius 12px.
3. **SPEC.md §6/§10 describe the prototype, not the product.** They specify a navy sidebar, Bricolage/IBM Plex, `#EDF1F7`, status hexes `#8391A7/#0B93B5/#D2780A/#7B5CE0/#1E9E68`, "+ New feature", "All features" and "Delete / Save". The spec also points at `prototype/clipped.html`, which doesn't exist (the file is `prototype/loose-ends.html`). The old status hexes survive as four of the seven `PCOLORS` project colours.
4. **Board and landing tokens drift by name and value.** They use different names for the same role (`ground`/`bg`, `sunk`/`inset`, `s-active`/`active`), and landing hairlines are one step lighter. The landing CSS is duplicated inline in `index.html` and `install.html` rather than shared.
5. **Duplicate or dead rules in `ui/index.html`**: `.side` is declared twice (`:62`, `:86`); `.nav-item[aria-current]` is declared twice (`:72`, `:92`); the table row hover is declared twice (`:312`, `:328`), and the second reads an undefined `--hover`; `.title-in` sets `letter-spacing` twice (`:257`); `var(--line-2,var(--line))` has a needless fallback (`:305`); the new-project form is behind `if(false)` (`:805`), but its styles remain.
6. **Pill radius is written two ways**, `99px` and `999px`. Radii outside the three tokens (2, 3, 4, 5, 6, 8, 12px) are literals.
7. **Sixteen distinct font sizes on the board**, including 9, 10, 10.5, 11.5 and 12.5px. There is no type scale token.
8. **Scrim opacity** is .28 for the drawer and .32 for the dialog. The ring shadow `rgba(0,0,0,.06)` is a literal in three places.
9. **Focus treatment varies**: outline, accent box-shadow ring, `currentColor` ring, and an `outline-offset:0` variant on the title input. `.side :focus-visible{outline-color:var(--accent)}` is redundant because `focus` equals `accent`.
10. **Undo is uneven**: status changes, bulk moves and "mark all seen" can be undone from the toast; deletes use a blocking `confirm()` and cannot.

## Open questions

- Is `landing/style.css` a discarded direction to delete, or a planned dark-first redesign?
- Should the board get a theme control, and should it honour the landing page's `clipped.theme` choice?
- Are the light-mode status pills meant to meet AA? Fixing them needs darker text hues (the orphan stylesheet already has candidates: `#09799a`, `#a25607`, `#6a45d6`, `#0f7446`).
- Should project badge colours become tokens, and be kept distinct from status hues? Today `#0B93B5`, `#7B5CE0` and `#1E9E68` read as active, review and done.
- Is `--display` meant to diverge from `--sans` again, or should it be collapsed?
- Should board and landing share one token file?
- Should the drawer trap focus, and should deletes get Undo instead of `confirm()`?
- Which is canonical for the product description: SPEC §10 or the shipped UI?

## Why it looks like this

See docs/decisions.md.
