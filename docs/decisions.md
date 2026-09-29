# Clipped — decision log

This log reconstructs the design and product decisions behind Clipped (called Loose Ends until 2026-09-27). It was assembled on 2026-09-29 from four sources, strongest first:

1. The Claude Code transcripts for this repo, nine sessions from 2026-09-22 to 2026-09-29. Session ids are cited by their first 8 characters: `759f590a` (phases 1–5, first dogfood), `44114d26` (five tabs), `bffa86a1` (friend install, rename, product review, cascade risk), `4d1369c6` (first landing page, UI review, areas, local address, first run), `70255f1e` (capture rules, pencils), `15ccab41` (friend install, lazy boards, install guide, Vercel), `62eb31af` (landing v2–v4, product restyle), `205ddcf9` (videos), `d70da3e1` (token cost).
2. The board's notes (LE-N1 to LE-N10) and card logs.
3. `git log` (81 commits) and diffs.
4. SPEC.md, CLAUDE.md, DOGFOOD.md, README.md, FIRST_PROMPT.md.

How to read the fields:

- **Decided by: user** means the transcripts show the user asking for it, choosing it from options, correcting toward it, or explicitly approving a specific proposal ("build it", "do 2 and 3", an AskUserQuestion answer). **Decided by: claude** means Claude chose and the user never weighed in on that choice. Where the user approved a direction but Claude picked the details, the line says so.
- **Why** is the reason someone actually gave. Where nobody gave one, it says "not recorded".
- SPEC.md, CLAUDE.md and `prototype/loose-ends.html` were written before the first transcript here, in a claude.ai session that isn't available (commit `65df0e4` links it). The user handed them over as "the UI we designed" and the source of truth, so those decisions are marked **user**, but their reasoning is mostly missing.

Decisions are grouped by area (design, ux, copy, docs, product, tech), then ordered by date.

---

## Design

### D-01 Each status has its own colour family and there is one blue accent
- Area: design
- Date: 2026-09-22
- Decided by: user
- Chose: idea grey, active cyan, parked amber, review (Your turn) violet, done green; a single blue accent (`#2F5BFF` light). Parked rows get an amber tint or stripe. The exact values were retuned on 2026-09-28, but the hues didn't change.
- Why: not recorded
- Considered: not recorded
- Cards: LE-3
- Evidence: `65df0e4` (prototype + SPEC §10 status colours). In `759f590a`, 2026-09-22, the user's first prompt calls the prototype "the UI we designed". `8374b13` retuned the values.

### D-02 The landing page remixes four sites the user picked
- Area: design
- Date: 2026-09-28
- Decided by: user
- Chose: Notion's rotating headline word, Cursor's light and delicate page, Clerk's tabbed one-line install box (Terminal / Claude Code / Ask Claude), and Cal.com's white cards with a grey preview panel.
- Why: the user named one thing they loved about each site ("its title that change the word", "the delicate design", "the way they show the installation line", "the way their cards look").
- Considered: Claude's list of 20 tech landing pages, including Linear, Resend, PostHog, Things, Obsidian, Arc, Superhuman and Notion. The user picked these four.
- Cards: LE-49
- Evidence: `62eb31af` 2026-09-28 10:03, where the user lists the four sites. The first remix is reconstructed in `docs/design-variants/landing-v2-first-remix.html`. It became live in `1396094`.

### D-03 The hero headline is "Never lose that ___ again." with the changing word in a centred code chip
- Area: design
- Date: 2026-09-28
- Decided by: user
- Chose: the user assembled the hero from two pages. The title came from the new page, with the changing word placed in a chip. The product picture on the right came from the original page. The subtitle and install box came from the new page, and the round "Read the source" button from the old one. The "Story" copy version won, and title B won out of four. A five-card story strip ("You started writing … Chaos.") went under the hero. On the same day, the 36-second intro video replaced that strip.
- Why: user preference, stated piece by piece. For the story strip, the user wanted "the powerful story I want a person to read and say to themselves — Build! I know that!!!". For replacing the strip with the video, the user approved Claude's placement proposal.
- Considered: title A "Which chat was that ___ in?", C "Every ___, on one board.", D "That ___? It's on the board."; copy versions Current, Sharp and Short; a typed word in the subtitle instead of the headline (the 2026-09-27 page).
- Cards: LE-49, LE-55
- Evidence: `62eb31af` 2026-09-28 10:34 (combination spec), 10:43 ("love the story 2 option"), 10:58 ("lets go with B"), 11:06 (story strip). `1396094` (v4 becomes index.html), `7d08c0f` (video replaces the strip). Variants v2 to v4 are reconstructed in `docs/design-variants/`.

### D-04 The board and the landing page share one design language
- Area: design
- Date: 2026-09-28
- Decided by: user
- Chose: the board UI took the landing page's tokens: warm off-white and near-black, white rounded cards in grey columns, pill buttons and tabs, mono status tags, and the fading blueprint grid. The grid stays fixed to the window, so content scrolls over it.
- Why: user: "A gap has created now: the landing page uses a different design language than the product itself." Also user: "i loved the grid background on the original landing page - add it", and asked for the background to stay still while scrolling.
- Considered: keeping the prototype's look (dark navy sidebar `#0B1220`, `#EDF1F7` page, Bricolage Grotesque / IBM Plex)
- Cards: LE-51, LE-78
- Evidence: `62eb31af` 2026-09-28 11:13 (the request) and 10:47 (the grid). `8374b13`, `4c2aeeb`. The pre-restyle board is at `8374b13^:ui/index.html`.

### D-05 Light is the default theme and dark follows the system
- Area: design
- Date: 2026-09-28
- Decided by: claude
- Chose: both pages default to a warm light theme and switch to dark under `prefers-color-scheme: dark`. The landing and install pages also have a sun/moon switch. The board has no switch and follows the system only.
- Why: Claude brought light-as-default in with the Cursor-style v2 page ("the warm off-white Cursor look as the default"). The user adopted v2 wholesale with "the rest of the site needs to be the same as the new one" but never discussed the default itself.
- Considered: dark only (landing, 2026-09-27 10:04, Claude's "more technical" pass); dark by default with a light switch (landing 2026-09-27 to 2026-09-28, recorded in LE-N4; the switch itself was the user's request, "allow to switch from white to dark mode"); the prototype's system-following light/dark.
- Cards: LE-19, LE-49
- Evidence: `4d1369c6` 2026-09-27 10:04–10:10; `da446d8` (dark default); `62eb31af` 2026-09-28 10:08 (v2) and 10:34; `1396094`; LE-N4.

### D-06 The board's sidebar is light
- Area: design
- Date: 2026-09-28
- Decided by: user
- Chose: a light, warm sidebar with the current project as a raised pill, replacing the dark navy sidebar that stayed dark in light mode.
- Why: Claude recommended it "so the app feels like the page"; the user answered "light sidebar" without giving a reason.
- Considered: keeping the sidebar dark in light mode, as in the prototype.
- Cards: LE-51
- Evidence: `62eb31af` 2026-09-28 11:13 (Claude's two questions) and 11:18 ("light sidebar, keep Geist — go ahead"); `8374b13`.

### D-07 Geist and Geist Mono are the typefaces everywhere
- Area: design
- Date: 2026-09-28
- Decided by: user
- Chose: Geist for text and headings, Geist Mono for code, statuses and labels, on the landing page, the install guide, the board and the videos. The design checker's "overused font" warning is silenced and recorded as the user's decision.
- Why: Claude picked Geist because it "read as technical" after the user said the top of the page still looked "childish" and asked for something more technical and code-oriented. The user then said "keep Geist" without a reason.
- Considered: Bricolage Grotesque + IBM Plex (the prototype's fonts; Claude said Bricolage's quirky shapes were "most of the childish feel"). Schibsted Grotesk + JetBrains Mono (Claude's less-common suggestion; the user said "try" it, then said it "look the same"). "A more distinctive font" (Claude offered this about four times).
- Cards: LE-19, LE-51
- Evidence: `4d1369c6` 2026-09-27 11:56–12:05; `bd23e4d` (Schibsted); `62eb31af` 2026-09-28 11:18; `1396094`, `8374b13`; LE-N4 "Considered".

### D-08 Marketing videos recreate the app, show a made-up project, and use a local AI voice with music
- Area: design
- Date: 2026-09-28
- Decided by: user
- Chose: a scripted recreation of the Claude Code desktop window, a fictional Nimbus CRM board filled by real `board` commands in the real UI, a female Kokoro voice generated locally, and a music bed.
- Why: from the option texts the user picked. Claude can't screen-record the desktop app, and a recreation keeps the user's real sessions off screen. Kokoro keeps the script on the machine. The real board is "busy and full of internal wording".
- Considered: the user screen-recording the app; this repo's real board; an Apple Premium voice; the user recording the voiceover; ElevenLabs; music only; silent. The male voice and the macOS Samantha voice were tried and dropped.
- Cards: LE-55, LE-64, LE-66, LE-68, LE-73, LE-90
- Evidence: `205ddcf9` 2026-09-28 12:44 and 14:40 (AskUserQuestion answers), 12:54 ("use the female voice"), 14:05 ("try with music"); `7d08c0f`.

---

## UX

### D-09 One board, three views (Table, Board, Timeline), with Table as the default
- Area: ux
- Date: 2026-09-22
- Decided by: user
- Chose: a table with editable cells and grouping, a kanban board with drag between columns, and a 14-day timeline that shows how long parked work has sat idle.
- Why: not recorded
- Considered: not recorded
- Cards: LE-3
- Evidence: `65df0e4` (prototype, SPEC §6, §10); `0e58524`.

### D-10 Ideas weigh nothing: they sit in one collapsed group and don't count toward progress
- Area: ux
- Date: 2026-09-23
- Decided by: user
- Chose: the Idea group is collapsed, with a one-line peek, and is excluded from the percentage. Claude offers once, when a brainstorm reaches decisions, to put the results on the board.
- Why: user: "i want us to be able to collect ideas brain storm and etc and make them as a group". Claude's reason for this form was that ten brainstormed ideas counted at 0% "would drag that 78% complete down to something like 40%".
- Considered: the user's own proposal of a separate "closed list" of ideas. Claude argued against it because it needs a schema change and new commands, and "flat idea lists rot". The user then asked for the group.
- Cards: LE-9
- Evidence: `759f590a` 2026-09-23 16:08–16:12; `c6de89a`.

### D-11 Clicking anywhere on a row opens its panel; editing needs the hover pencil
- Area: ux
- Date: 2026-09-24
- Decided by: user
- Chose: a single click opens the card or note panel from any row, on every tab. The title and note show a pencil on hover, and only a pencil click turns the cell into a field. The note is read-only in the table. With a panel open, one click on another row switches straight to it.
- Why: user: "when clicking on row on the ui - the info panel needs to open". Later the user described the pencil model exactly: "only by clicking on the edit it will be allow the user to edit — if not clicked in the edit icon the row will be clickable". The user also said switching was "very slow".
- Considered: double-click to open (the prototype; Claude said it "never advertised" itself); an always-editable note cell (Claude flagged the conflict, and the user picked "make the note read-only in the table").
- Cards: LE-23, LE-30
- Evidence: `759f590a` 2026-09-24 13:26–13:34; `70255f1e` 2026-09-27 10:11; `4d1369c6` 2026-09-27 17:17; `a79c953`, `364400b`, `36756a2`, `06e45d1`.

### D-12 Five tabs: Work and Questions hold cards; Brainstorms, Plans and References hold notes
- Area: ux
- Date: 2026-09-24
- Decided by: user
- Chose: two collections behind five tabs. A question is a card because it has a next step and an end. Brainstorms, plans and references are lighter notes with no status. The rule: a card has a next step, a note doesn't.
- Why: user: ideas, market research and references come up mid-flow, and "any idea tossed out or reference mentioned requires scrolling back and breaking the flow". The user then asked "can it be added as tabs?".
- Considered: Claude pushed back. It proposed `question` as a type plus a Group-by-Type option, plans as a filter facet, and references kept out of the product ("tabs are group-by with amnesia"). The user answered "do all 5", and Claude replied: "You raised it, I pushed back, you've decided".
- Cards: LE-15
- Evidence: `44114d26` 2026-09-24 13:44–13:50; LE-N1. The work landed inside `76dc37b`, whose message describes something else. The user chose "Leave it" rather than rewrite pushed history.

### D-13 Notes get their own panel, linked both ways with the cards they produced
- Area: ux
- Date: 2026-09-24
- Decided by: user
- Chose: one panel shell with a body per kind. A brainstorm shows "what was decided" and "what it produced". A plan shows its document and "Bring it to the board again". A question drops the progress bar and steps. A card lists "Where it came from".
- Why: the user asked what the panel should show for brainstorms, questions and plans. The user approved Claude's answer ("build it"), which was one shell with four bodies "instead of the feature drawer pretending to fit everything".
- Considered: no panel for references (Claude: "may not need a drawer").
- Cards: LE-18
- Evidence: `bffa86a1` 2026-09-24 14:50–14:52; `00e78e6`.

### D-14 "Your turn" closes in one click, the numbers stop flattering, and every change can be undone
- Area: ux
- Date: 2026-09-27
- Decided by: user
- Chose: "Looks good — Done" and "Needs work" (with a reason) on cards waiting for the user. An Undo toast after status changes. The panel autosaves. The headline counts only Done, and "N waiting on you" sits beside it. Proof links, bulk actions, blue "changed since you looked" dots and `~` paths were added too.
- Why: Claude's builder and PM walkthrough said review cards were piling up (21) and the percentage counted the user's queue as nearly done. The user picked 15 of the 28 suggestions by id.
- Considered: the 13 unpicked suggestions, now ideas LE-31 to LE-43. They include a "Last 7 days" view, a phone view listing only what's waiting, and "home leads with waiting on you".
- Cards: LE-27, LE-30, LE-31–LE-43
- Evidence: `bffa86a1` 2026-09-27 12:47 ("fix the things you just listed"); `4d1369c6` 2026-09-27 15:48–15:53 ("A1 A2 A4 A5 B1 B2 C3 D3 D4 E1 E4 F1 F2 F3"); `16b22da`, `0237e66`; LE-N3.

### D-15 Only two keyboard shortcuts: `/` for search and `n` for a new card
- Area: ux
- Date: 2026-09-27
- Decided by: claude
- Chose: `/` and `n`, plus Esc to clear. Both are suppressed while typing or while a panel is open.
- Why: Claude: "Two, deliberately — a bigger keymap is one nobody asked for and everybody has to be taught."
- Considered: not recorded. The user approved fixing "no keyboard anything" but never discussed which keys.
- Cards: LE-27
- Evidence: `bffa86a1` 2026-09-27 12:55–13:00; `16b22da`.

### D-16 Projects without a board show in the sidebar, drawn from folders Claude Code has worked in
- Area: ux
- Date: 2026-09-24
- Decided by: user
- Chose: the sidebar lists every folder that appears in `~/.claude/projects` session files, greyed out with "Create board". It skips `$HOME`, hidden folders, Claude's own folders and `Library`. The user approved the feature; limiting it to Claude Code folders was Claude's call, and Claude flagged it as one the user "might disagree" with.
- Why: user: "why i dont see all the project i have in claude code in the ui". Claude's reason for the scope: "the board is about work you're actually doing".
- Considered: pointing at any folder manually (Claude: "a different feature"); letting the web page initialise any path (rejected as a security risk, so only known paths are accepted).
- Cards: LE-12
- Evidence: `759f590a` 2026-09-24 13:15–13:26 ("build it"); `e44b486`.

### D-17 Work is grouped by product area inferred from files; parent/child nesting waits
- Area: ux
- Date: 2026-09-28
- Decided by: user
- Chose: each card gets an Area, taken from the folder most of its files are in until the area is named. There is an Area column with a status-style dropdown, Group by Area, and a multi-select Area filter chip that reads "All" when empty and "N areas" when several are picked. Parents were removed from the data model before release.
- Why: user: "I still think people will confuse the 'area' with the 'parent'. I want to keep it simple at first."
- Considered: Claude recommended area plus parent. Both parent displays were built on two demo projects for the user to compare: a "↳ parent" line under the title, and a "Part of" column. Also in LE-N7: one strict tree (Jira epics), tags only ("they drift"), a free graph ("unreadable in a list"), and deep nesting ("hides work").
- Cards: LE-69, LE-71, LE-76
- Evidence: `4d1369c6` 2026-09-28 15:18 (brainstorm), 15:35 ("the user won't understand it, maybe use as tag?"), 15:44–15:57, 16:19–16:31; `5c82a8e`, `4c2aeeb`; LE-N7.

### D-18 The table chrome stays out of the way until asked for
- Area: ux
- Date: 2026-09-28
- Decided by: user
- Chose: the table header stays pinned (the table scrolls in its own box). The "+ New" row appears only after clicking "+ New card" and closes on a second click. Search is a magnifier left of the Area chip. The menu folds to a rail on click. The sidebar dropped the per-project parked count and the Live chip. Group rows fold from a click anywhere on the row. Columns resize by dragging.
- Why: all were user requests. The only stated reason is for the sticky header: "in order to show the user what's the columns".
- Considered: pinning the header to the screen with the whole page scrolling. Claude called it "a bigger change to the page layout" and didn't do it.
- Cards: LE-57, LE-59, LE-74, LE-75, LE-77, LE-79–LE-82
- Evidence: `4d1369c6` 2026-09-28 12:33, 16:12–16:45; `a21956e`, `a7429c7`, `49a70d7`, `4c2aeeb`, `865ffaf`.

### D-19 First-time users get an empty state, a sample project, a self-ticking checklist and a tour, built locally only
- Area: ux
- Date: 2026-09-28
- Decided by: user
- Chose: build all seven ideas from LE-N9 on a local test board, with no deploy until the user has looked. The next step (LE-N10) is a guided two-minute test session in a scratch folder.
- Why: user: first-time users "probably won't have anything"; "the page needs to invite the user to interact and engage".
- Considered: a tour on the empty screen ("nothing to point at yet"); fake cards on the user's real board; pre-filling boards by reading past conversations (breaks the "never read what was said" promise); starting Claude from the browser (not possible).
- Cards: LE-91, LE-92
- Evidence: `4d1369c6` 2026-09-28 18:45–23:20 ("can you do it only locally dont deploy it", "build every thing include 4,5,6,7"); LE-N9, LE-N10. Not committed: it lives in the main checkout's working tree.

---

## Copy

### D-20 The product is called Clipped
- Area: copy
- Date: 2026-09-27
- Decided by: user
- Chose: "Clipped". It is the plugin id, the skill, the `/clipped:*` commands and the `CLIPPED_*` env prefix, and `~/.loose-ends` migrated to `~/.clipped`. The CLI stays `board` (with `clipped` as an alias since 0.4.0), and the data file stays `.board/board.json`.
- Why: not recorded. The user typed "Clipped" instead of choosing any offered option.
- Considered: Threads, Halfway, Parked and "Keep Loose Ends" (Claude's options). Later that day, in the product review, Claude argued the name "is working against you": it's past tense, it means "cut short", and "Clipped board" sounds like "clipboard". Claude suggested Parked, Halfway, Breadcrumbs or Pickup. The user didn't rename or reply to that point.
- Cards: LE-20, LE-21
- Evidence: `bffa86a1` 2026-09-27 09:25–09:31 (AskUserQuestion; answer "Clipped"), 11:59 (the critique); `508918c`, `de1c428`.

### D-21 Half-done work is "Parked", with a line saying where you stopped
- Area: copy
- Date: 2026-09-22
- Decided by: user
- Chose: `parked` is a first-class status, and parking requires a note. The session brief always carries parked notes, and the UI shows how long parked work has been idle.
- Why: SPEC principle 5: "'Parked' is the heart of the product." No further reasoning was recorded.
- Considered: not recorded
- Cards: LE-1
- Evidence: `65df0e4` (SPEC §1); `25fd493` ("park requires a note"); `4b4d5a8` (the brief keeps parked notes).

### D-22 Words that fought each other were renamed: "Your turn", "Work", `/clipped:question`, `--next / --stopped / --check`
- Area: copy
- Date: 2026-09-27
- Decided by: user
- Chose: the `review` status is labelled **Your turn**. The Features tab is **Work** and its column is **Card**. `/clipped:ask` became `/clipped:question`. The card's note takes the flag that names its meaning in each status. `done` stops calling everything a feature.
- Why: Claude's product review said "Review" means code review "to every developer alive", the Features tab held bugs and chores, `/ask` read like "ask Claude something", and "note" meant two things. The user approved: "do 2 (Words fighting each other) and 3 (Copy that won't land) … and the rest".
- Considered: "Check it" instead of Your turn, and "Cards" instead of Work (both offered by Claude).
- Cards: LE-28
- Evidence: `bffa86a1` 2026-09-27 11:59–12:11; `de1c428`.

### D-23 The install call to action says "Install it" and leads with the two commands
- Area: copy
- Date: 2026-09-27
- Decided by: user
- Chose: the main button says "Install it" and the FAQ is headed "Before you install" (Claude's copy, approved in the same batch as D-22). The hero shows the two `/plugin` commands first, with "or ask Claude to install it" as the alternative (the user's call).
- Why: Claude: "Add now — add what, to where?"; "Things friends asked me" alienates strangers. User, on Claude's version that led with the spoken sentence: "not so sure users will understand it, what about the run regularly (two command lines)".
- Considered: leading with "Install the Clipped plugin from …" as a sentence; "Get the two commands".
- Cards: LE-19, LE-28
- Evidence: `bffa86a1` 2026-09-27 11:18–11:20, 12:04; `bae9a60`, `de1c428`.

### D-24 Marketing examples are a CRM, "Nimbus CRM"
- Area: copy
- Date: 2026-09-27
- Decided by: user
- Chose: the example sessions, boards and videos use a CRM: a half-built CSV import, email sync, and drag-and-drop order.
- Why: user: "change it to something that related to build crm app". No reason given.
- Considered: "Loopstation", a loop sampler (Claude's original); four hero scenes Claude offered, which the user dismissed.
- Cards: LE-19
- Evidence: `bffa86a1` 2026-09-27 10:19–10:59; `3f7aca3`.

### D-25 The messaging speaks to builders
- Area: copy
- Date: 2026-09-28
- Decided by: user
- Chose: the videos address "you, as a builder" and end on "As a builder, your job is to ship. Let Clipped remember the rest." The user set the direction; Claude wrote the exact line.
- Why: user: "i want another video in this way of thinking but in the end stronger sentence — this had to be with a messaging to builders".
- Considered: "Stop searching. Start shipping." and "You build. Clipped remembers." (Claude's alternatives; the user's pick isn't recorded).
- Cards: LE-66, LE-90
- Evidence: `205ddcf9` 2026-09-28 15:04–15:16, 17:45.

---

## Docs

### D-26 SPEC.md is the source of truth, and CLAUDE.md holds the working rules
- Area: docs
- Date: 2026-09-22
- Decided by: user
- Chose: SPEC.md defines scope, data model and behaviour; CLAUDE.md holds the rules for Claude (CLI-only writes, migrations, no network, check the plugin docs first); DOGFOOD.md is the phase-4 log; README.md covers install and the dev loop.
- Why: not recorded beyond CLAUDE.md's own line: "It is the source of truth".
- Considered: not recorded
- Cards: none
- Evidence: `65df0e4`; `1841daf` (DOGFOOD.md, written by Claude when phase 4 started). SPEC §10 and README have since gone stale (see Gaps).

### D-27 The install guide is its own page, linked from the header, in the landing page's design
- Area: docs
- Date: 2026-09-27
- Decided by: user
- Chose: `landing/install.html` walks through Node, the desktop and terminal routes, first run, a four-message check, troubleshooting, and updating or uninstalling. It is linked from the landing page's header, and it was restyled to match the landing page.
- Why: user: the install section "should be a separate page … that not just shows the prompt but guides the user for all sorts of things". User: "it won't be part of the landing page because it's long", and it "needs to have the same design language". Claude built 0.3.2 first "otherwise the guide would include an `init` step and a permission rule that are about to go away", and the user agreed.
- Considered: keeping install steps only on the landing page.
- Cards: LE-24, LE-25, LE-54
- Evidence: `15ccab41` 2026-09-27 10:59–11:00 ("yes go ahead, 0.3.2 first"); `4d1369c6` 2026-09-28 11:34–11:41; `bae0c6f`, `690b1f9`.

### D-28 Documents hold the reasoning and the board holds the state; any unchecked checklist in a doc is work
- Area: docs
- Date: 2026-09-24
- Decided by: user
- Chose: `/clipped:plan <doc>` turns a spec or plan into cards that link back to it. Unchecked boxes become cards whatever heading they sit under, and ticked ones stay put.
- Why: Claude found that the old rule would have thrown away the five most actionable items in the Owl doc "because they happened to sit under a heading called 'Open questions'". The user picked option 2.
- Considered: option 1, only the features as ideas; option 3, nothing until building starts.
- Cards: LE-14, LE-16
- Evidence: `759f590a` 2026-09-24 13:37–13:48 ("option 2"); `693fbc6`, `a0a7b2f`.

---

## Product

### D-29 Local-first: boards never leave the machine
- Area: product
- Date: 2026-09-22
- Decided by: user
- Chose: each board is `.board/board.json` inside its repo, plus a registry at `~/.clipped/projects.json`. Board content is never sent over the network. Any server of ours would keep only an account and anonymous event counts.
- Why: not recorded beyond the principle, and CLAUDE.md's "Never send board content anywhere over the network".
- Considered: not recorded
- Cards: none
- Evidence: `65df0e4` (SPEC §1 principles 1–2, CLAUDE.md).

### D-30 Claude may say "Your turn", but only the user says Done
- Area: product
- Date: 2026-09-22
- Decided by: user
- Chose: Claude moves finished work to `review` (Your turn) with a line on what to check. Done needs the user's word or a strong signal (merge or deploy).
- Why: SPEC principle 4: "Never close a feature on a guess." Claude cited it several times when it refused to close its own cards (for example LE-2 on 2026-09-23).
- Considered: not recorded
- Cards: LE-2, LE-30
- Evidence: `65df0e4`; `759f590a` 2026-09-23 14:50 ("closing a card on a guess is the one rule the whole thing rests on").

### D-31 Analytics are event names and counts only, and the plugin sends nothing today
- Area: product
- Date: 2026-09-23
- Decided by: user
- Chose: the CLI's PostHog (EU) client sends only allowlisted event names and short enums or numbers, never titles, notes, paths or names. It is on by default with `board telemetry off`, but it is dormant because no key is set. Sign-in (Clerk) and the users table (Supabase) are built in `site/` but not deployed.
- Why: SPEC §7 and CLAUDE.md ("Analytics (later) = event names and counts only"). The user picked Clerk and Supabase from Claude's recommended options, and said the domain was "not yet" bought.
- Considered: Auth.js; Vercel Postgres / Neon; "decide later". Opt-in telemetry was asked on 2026-09-27 and never answered (see Gaps).
- Cards: LE-5, LE-48
- Evidence: `759f590a` 2026-09-23 13:56 (AskUserQuestion); `2c5d7d3`; `cli/src/analytics.ts`.

### D-32 The website counts visits and install clicks with Amplitude; the plugin still sends nothing
- Area: product
- Date: 2026-09-28
- Decided by: user
- Chose: Amplitude on the landing page and install guide only, in the EU region, with no cookies and no stored IPs. It tracks six events (install method chosen, command copied, install button, guide opened, GitHub clicked, FAQ opened), and the page says so. Claude chose the privacy settings.
- Why: user: "how can i know how many people will use this skill?" and "maybe lets add amplitude event to the landing page". Claude: this keeps the "0 bytes" promise true "since the promise is about the plugin, not the website".
- Considered: the GitHub traffic page (the user opened it too).
- Cards: LE-58
- Evidence: `4d1369c6` 2026-09-28 12:44–14:28; `ecaeae3`; LE-N6.

### D-33 Capture is broad: answers, decisions, unpicked suggestions and the user's own to-dos all land on the board
- Area: product
- Date: 2026-09-27
- Decided by: user
- Chose: a table, ranked list, comparison or recommendation becomes a question card, even when answered from memory, and "elaborate" updates the same card. Items the user didn't pick from a list Claude proposed become ideas. Steps only the user can do become chores waiting on them. Decisions that settle over many small steps get one brainstorm note with "what was considered". Questions asked through Claude's multiple-choice widget are recorded by a hook.
- Why: real misses. A Braille.AI research answer and a friend's twelve-row gaming table never reached the board. The user said "why it hasn't add those ideas by himself?" and "I wouldn't want any of them to slip through the cracks". The user approved each rule: "fix the rule", "Also change the rule", "yes do both", and asked for the widget capture.
- Considered: recording only researched answers (the old rule); asking before adding unpicked items (the old behaviour).
- Cards: LE-22, LE-60, LE-31–LE-47
- Evidence: `70255f1e` 2026-09-27 10:01–10:07; `15ccab41` 2026-09-27 10:35; `4d1369c6` 2026-09-27 17:27–17:39, 2026-09-28 14:42; `6b4a24a`, `81ef92f`, `35584b1`, `ad13e78`, `e37a3bb`.

### D-34 The session brief doesn't hand Claude its own unconfirmed guesses as facts
- Area: product
- Date: 2026-09-27
- Decided by: user
- Chose: the brief carries prose only where it earns its place: parked notes always, and an active card's next step once a human has touched it. It never carries review prose. Cards only Claude has touched are marked `(mine)`, and after a fortnight untouched they collapse into a one-line count. The skill says to check a card against the repo before building on it, and to fix an unconfirmed card rather than extend it.
- Why: user: "if a cascading error occurs — where the board misclassifies something and the user doesn't notice — then the next time the session starts, it will read the board and potentially perpetuate that error". The user asked to "minimize as much as possible the risk", then said "yes" to Claude's layers 1 and 2 and "continue" for layer 3.
- Considered: a one-way board where Claude writes but never reads (the user's first ask); a per-project `settings.brief: off | on-demand | auto`, with on-demand as Claude's recommendation; an explicit `confirmed` bit (schema v3, deferred until after dogfooding).
- Cards: LE-26
- Evidence: `bffa86a1` 2026-09-27 13:16–13:55; `4b4d5a8`.

### D-35 Clipped should cost about 1% of tokens, so the Stop hook nudges only when code changed, once per turn
- Area: product
- Date: 2026-09-28
- Decided by: user
- Chose: the end-of-turn hook blocks once, only when code changed and the board didn't. The reply-text check (added the same day at the user's request) was removed.
- Why: user: "how can we make the usage to be around 1 percent or less — im afraid it will push back users?" Claude measured 7 nudges causing about 3.7M re-read tokens, with 6 of them from the reply-text check, which produced 2 board writes out of about 174.
- Considered: capping the reply-text check at once per session; a per-session nudge cap; skipping nudges on short turns; trimming SKILL.md; capping the Your-turn list in the brief; a size-budget test (offered; the user said "dont do anything"). The user chose "step 1 only".
- Cards: LE-50, LE-87
- Evidence: `4d1369c6` 2026-09-28 10:54–11:03 ("build the end-of-turn hook for it"); `d70da3e1` 2026-09-28 17:12–17:45; `2ba0973`, `922d4f4`.

### D-36 Each project shows its Claude Code sessions, active time and open time, but not tokens or cost
- Area: product
- Date: 2026-09-28
- Decided by: user
- Chose: a strip under each project title, read locally from `~/.claude/projects` logs and refreshed every minute. Tokens were deferred by the user; cost was left out by Claude.
- Why: user: "lets start with sessions, active time, time sessions were open". Claude on cost: "prices change and the figure could mislead".
- Considered: tokens written and read from cache; a dollar estimate.
- Cards: LE-65
- Evidence: `4d1369c6` 2026-09-28 14:53–15:00; `53633d7`.

### D-37 A board appears the first time there's something worth keeping; nobody runs `init`
- Area: product
- Date: 2026-09-27
- Decided by: user
- Chose: `board add`, `board ask` and `board note add` create the board at the repo top (or the folder), named after it. `$HOME`, hidden folders and Claude's own folders are refused. The skill pre-approves `board` for its turn.
- Why: a friend's first session recorded nothing because the folder had no board, and Claude only offered `init` once building started. Claude proposed lazy creation, and the user said "yes go ahead, 0.3.2 first".
- Considered: running `board init` automatically in every session (Claude: it would leave `.board/` folders everywhere, including home and scratch folders); keeping the one-time offer.
- Cards: LE-24
- Evidence: `15ccab41` 2026-09-27 10:35–11:00; `81ef92f`.

### D-38 Boards are committed to the repo they describe
- Area: product
- Date: 2026-09-23
- Decided by: user
- Chose: `.board/board.json` goes into git, and a `.board/.gitignore` keeps the lock and backup files out. The FAQ leaves the choice to each user.
- Why: Claude framed it as "board in git history, survives clones" versus local-only. The user said "commit the board files in both repos" without a reason.
- Considered: adding `.board/` to `.gitignore`. Claude warned that boards in public repos are world-readable and that board diffs appear in PRs.
- Cards: LE-4
- Evidence: `759f590a` 2026-09-23 13:42–14:22; `1841daf`.

---

## Tech

### D-39 Every board write goes through the `board` CLI, including the UI's
- Area: tech
- Date: 2026-09-22
- Decided by: user
- Chose: the local server shells every write through the CLI's command layer, so the browser can't produce a board.json the CLI would refuse (for example, parking with no note).
- Why: SPEC §4 "so the structure stays valid"; CLAUDE.md rule.
- Considered: not recorded
- Cards: LE-1, LE-3
- Evidence: `65df0e4`; `0e58524`.

### D-40 Every schema change bumps `schemaVersion`, and old boards migrate on first read, with a backup
- Area: tech
- Date: 2026-09-22
- Decided by: user
- Chose: a migration chain. The CLI refuses boards from a newer version and writes `board.json.vN.bak` when it upgrades. Boards are now at v4: v2 added notes, v3 links and "considered", v4 areas. The user set the rule; Claude chose "silently on first read".
- Why: CLAUDE.md: "Keep board.json backward compatible". The silent upgrade has bitten three times: real boards were upgraded by an uncommitted build, and old plugins then couldn't read them. That is now a memory note ("Schema bumps upgrade live boards").
- Considered: not recorded
- Cards: LE-1, LE-69
- Evidence: `65df0e4`; `25fd493`; `759f590a` 2026-09-27 09:09; `4d1369c6` 2026-09-28 15:35–15:57.

### D-41 The CLI ships as one dependency-free bundle inside the plugin
- Area: tech
- Date: 2026-09-23
- Decided by: claude
- Chose: esbuild bundles `cli/src` into `bin/board.cjs`, behind a small sh wrapper. A test fails if the bundle drifts from the source.
- Why: Claude: "the plugin can't rely on `npm install`". CommonJS because an extensionless file next to `"type": "module"` "gets loaded as ESM and dies".
- Considered: not recorded
- Cards: LE-2
- Evidence: `e0164e9`, `bfc37a7`; `759f590a` 2026-09-23 13:11–13:19.

### D-42 The board is served from this machine at `clipped.localhost:4747`, not from a website
- Area: tech
- Date: 2026-09-28
- Decided by: user
- Chose: `board ui` opens `http://clipped.localhost:4747` (plain `localhost:4747` still works) and reuses a running board instead of starting a second one on the next port. It runs in the background, remembers a fallback port, stops with `--stop`, and every session is told the link. Saying "open the board", "open clipped" or just "clipped" / "clippd" opens it.
- Why: user, after asking whether a hosted page is exposed to breaches: "lets go with clipped.localhost:4747". Claude's point was that this option "doesn't have this risk at all, because the code still comes from your own disk". The user asked "how will the user know how to open the board? if it always changes ports?" and then "ok build the fix for the port". The user added the "clipped"/"clippd" phrases.
- Considered: the SPEC's original plan, a hosted UI at `looseends.dev/app` / `useclipped.dev/app` talking to localhost. Claude recommended this one. Its downsides: dead when the server is off, Chrome's local-network prompt, Safari blocking https→localhost, and a bigger attack surface. An ngrok tunnel was rejected because it puts boards online.
- Cards: LE-83, LE-84, LE-85, LE-86, LE-88
- Evidence: `4d1369c6` 2026-09-28 16:51–17:26; `5f22db4`, `bc3559a`, `99d7004`; LE-N8.

### D-43 The plugin is developed from a local directory marketplace
- Area: tech
- Date: 2026-09-24
- Decided by: user
- Chose: install the Claude Code CLI and point the `clipped` marketplace at the working tree. `npm run plugin:sync` reinstalls with no commit, push or version bump. Switch back to `avivalushai/clipped` to test a real install.
- Why: from the chosen option's text: rule changes take effect "with no update step", which matters because phase 4 is tuning rules.
- Considered: staying on the GitHub loop ("three clicks and a restart per change"); leaving it for later.
- Cards: none
- Evidence: `759f590a` 2026-09-24 12:48–12:52 (AskUserQuestion); `58952bd`.

### D-44 Every shipped change bumps the plugin version, and a test keeps the landing badge in step
- Area: tech
- Date: 2026-09-24
- Decided by: claude
- Chose: bump `package.json`, `.claude-plugin/plugin.json` and `board --version` together on each release, with a test that checks all of them. The landing badge is still typed by hand, but a test now fails when it disagrees.
- Why: Claude: "Claude Code caches plugins by version directory … when you ship him a fix later, he only gets it if the version changed". The user agreed to the badge test ("yes, add the test") but didn't weigh in on the bump policy.
- Considered: filling the badge in at build time (needs a build step the landing page doesn't have).
- Cards: LE-45
- Evidence: `bffa86a1` 2026-09-24 14:21; `c6ef7bb`; `4d1369c6` 2026-09-28 10:24–10:30; `0c9ce0a`.

### D-45 The landing site is static HTML on Vercel, deployed on every push to main
- Area: tech
- Date: 2026-09-27
- Decided by: user
- Chose: a plain `landing/` folder (no build step) served at `useclipped.vercel.app`, auto-deployed from `main`. Rendered video MP4s stay out of git; only the 12 MB web cut ships with the site.
- Why: the user chose "durable" over Claude's quick claude.ai artifact link, then said "deploy the landing page" and "connect vercel to github so it deploys automatically". The user picked `useclipped` after `clipped.vercel.app` and `getclipped` were taken. Claude suggested ignoring the 77 MB of renders, and the user approved the commit.
- Considered: publishing as a private claude.ai artifact (it was, for preview); GitHub Pages; the `site/` Next.js app (its future is open question LE-48).
- Cards: LE-11, LE-19, LE-48
- Evidence: `4d1369c6` 2026-09-27 09:34 ("durable"), 12:17–12:32; `15ccab41` 2026-09-27 11:11–11:17; `205ddcf9` 2026-09-28 14:27–14:40; `797bd9c`, `7d08c0f`; LE-N5.

---

## Designs Claude generated

**Short answer:** yes. Claude produced several landing-page variants, a two-way A/B of the board's parent display, and a series of video cuts. Most were never committed. The landing variants v2, v3 and v4 were deleted before commit ("delete v2 v3 v4 and commit"), but every edit that made them is in transcript `62eb31af`. They have been rebuilt by replaying those edits. The replay is exact: the replayed final v4 matches commit `1396094` byte for byte, after the one logo-link change made at copy time.

### Rebuilt from the transcript and copied into the repo (`docs/design-variants/`)

| File | What it is | Date |
|---|---|---|
| `landing-v2-first-remix.html` | The first Notion/Cursor/Clerk/Cal remix: centred hero, "Never lose what you ___" rotating word, tabbed install box, Cal-style cards | 2026-09-28 10:08 |
| `landing-v2-copy-switcher.html` | v2 rebuilt on one 3-column grid, with a bottom bar switching copy between Current, Sharp, Story and Short (`?copy=story`) | 2026-09-28 10:22 |
| `landing-v3-combined-hero.html` | The user's combination: new title with the word in a chip, the original page's example board on the right, new install box, old "Read the source" button | 2026-09-28 10:37 |
| `landing-v4-title-switcher.html` | v4 before a title was chosen: A–D title switcher (`?title=b`), grid background, round Read-the-source button, tighter sections | 2026-09-28 10:52 |
| `install-guide-unused.html` | Claude's own `install.html`, written in `bffa86a1` while another session's guide (the one that shipped) was landing. Recovered from that session's scratchpad | 2026-09-27 11:10 |

See `docs/design-variants/README.md` for how to open them.

### Surviving in git

- **Original prototype**: `prototype/loose-ends.html`. It opens standalone with sample data, in the navy look with Bricolage and IBM Plex fonts.
- **Board before the restyle** (navy sidebar, Bricolage/IBM Plex): `git show 8374b13^:ui/index.html > /tmp/board-navy.html`. It needs the local API for data, so the easiest way to view it is `git worktree add /tmp/old 8374b13^ && cd /tmp/old && npm i && ./bin/board ui --port 4760`.
- **Landing page history**, one checkpoint per look:
  - `da446d8`: first page, dark navy developer-tool look, Bricolage/IBM Plex, dark default with a light switch
  - `bd23e4d`: Geist tried, then Schibsted Grotesk/JetBrains Mono, with a board preview beside the hero
  - `5d6abde` / `2ba0973`: the last version before v4 replaced it
  - `1396094`: v4 as shipped, with the story strip
  - `7d08c0f`: the story strip replaced by the intro video

  To view one, run `mkdir -p /tmp/lp-X && git archive <sha> landing | tar -x -C /tmp/lp-X && python3 -m http.server 4801 --directory /tmp/lp-X/landing`.
- **Intro video source**: `video/clipped-intro.html` and `video/voiceover.txt` (committed in `7d08c0f`). Open the HTML in a browser to play it live. The web cut is `landing/video/intro.mp4`.

### Surviving outside git (not copied, too large or not a design file)

- **Rendered videos**, in the main checkout `/Users/avivalush/Projects/loose-ends/video/` and gitignored: intro (silent, voice and music versions, 1080p and 4K), `clipped-real`, `clipped-builder`, `clipped-organized`, `clipped-week`, `clipped-week-builder`, `clipped-week-builder-mess` (each with a 4K master). Their sources and real UI captures are in `video/real/` there (8.3 MB, uncommitted; the user said "dont commit").
- **claude.ai artifact "Clipped"**: https://claude.ai/artifact/F5Bfynz4ePg8EmHu8Yh8xh, last updated 2026-09-27. It is the dark first landing page as published for preview during `4d1369c6`, and still in the user's gallery.
- **claude.ai artifact "Loose Ends"**: https://claude.ai/artifact/4XQZTGqygSp5kxuJxHydbq, last updated 2026-09-22. Its date and title suggest it's from the pre-repo design session, but its content wasn't checked.
- **Demo boards**: `~/Projects/clipped-demo/.board/board.json` (the "Ledgerly" project used for the area and parent comparison) and the first-run sample board. Both are data only.
- **Scratchpad screenshots** of many intermediate states, under `/private/tmp/claude-501/-Users-avivalush-Projects-loose-ends/<session>/scratchpad/`: `4d1369c6` (about 60 PNGs of the first landing page's iterations), `205ddcf9` (video stills), `62eb31af` and `bffa86a1` (landing screenshot shoots). These are temporary directories and will disappear.
- **First-run onboarding (LE-92)**: exists only as uncommitted changes in the main checkout's `ui/index.html` and server files. The user asked to see it locally before anything ships.

### Lost

- **The parent-display A/B** (2026-09-28 15:44–15:48): parent as a "↳" line under the title (A) versus a "Part of" column (B), on two demo projects. A temporary switch chose the style from the project name. It was removed when the user chose area-only, and it was never committed. Only Claude's description of it remains in the transcript.
- **The "three variants from three sites" plan** (`landing/variants/a,b,c.html`, 2026-09-27 11:43) was never built. The user moved on to layout fixes, and the idea came back the next day as v2.
- **Intermediate states of the first landing page** between commits (the rainbow typed word, a hero terminal in dark only, IBM Plex/Geist mixes). There are screenshots in the `4d1369c6` scratchpad and some earlier states in the claude.ai artifact's version history, but no HTML.
- **Dropped voices** (macOS Samantha, the male Kokoro voice): deleted.
- **The pre-repo design conversation** that produced SPEC.md and the prototype: not in these transcripts.

---

## Gaps

These decisions clearly happened, but their reasoning isn't recorded anywhere, or they were left half-made.

1. **The prototype's whole visual system**: the blue accent, the status colours, the 4747 port, Table as the default view, and the navy sidebar that stayed dark in light mode. All came from a claude.ai session this repo doesn't have. Commit `65df0e4` links to it.
2. **Why "Clipped"**: the user typed the name without a reason. Later the same day Claude argued it works against the product. The review ended with "Decide the name question deliberately, once, and then stop", and that decision was never taken.
3. **Light versus dark as the default**: this flipped from dark (LE-N4, 2026-09-27) to light (2026-09-28) as a side effect of adopting v2 wholesale. Nobody discussed it. LE-N4 still says "Dark by default".
4. **Why Geist was kept** after the design checker flagged it as overused four times and Claude offered alternatives each time: the user said "keep Geist" with no reason.
5. **"0 bytes" on the landing page**: Claude recommended replacing it with "No account, no cloud" because the claim may age badly. The copy pass applied every other suggestion but deliberately left this one, and the user never weighed in. It's still on the page.
6. **Telemetry opt-in or opt-out**: Claude asked on 2026-09-27 whether to make it opt-in or keep it on and disclose it. The user answered only the hosting question. SPEC §7 still says opt-out, and the code defaults to on (dormant without a key).
7. **What happens to `site/`** (the Next.js sign-up, device-code login and hosted `/app`) now that `landing/` is live and the board stays on localhost. This is open question LE-48, and SPEC §2 and §9 still describe the hosted plan.
8. **Why the board has no theme switch** while the landing page does. Never discussed.
9. **Stale docs versus "SPEC is the source of truth"**: SPEC §10 still describes the navy sidebar, Bricolage/IBM Plex, the double-click to open and a "Features" tab. README still says "Features" and points to `prototype/clipped.html`, which doesn't exist (the rename's find-and-replace changed the path, not the file).
10. **The exact ending line of the builder videos**: Claude offered three and asked the user to pick. The pick isn't recorded, and LE-66 and LE-90 are still waiting on the user.
11. **Why the user wanted a CRM as the example project**: stated as a request only.
