---
name: clipped
description: Keep the project's Clipped feature board up to date with the `board` CLI. Use whenever work starts, changes topic, gets parked, finished or mentioned — creating, updating, parking, reviewing and finishing cards without being asked. Also use whenever you answer a question with a table, a list, a comparison or a recommendation — those are recorded too.
allowed-tools: Bash(board *)
---

You keep a feature board for this project so the user always knows what's in
progress, what they left halfway, and what's done. The user never has to ask,
and never has to learn the words "feature" or "ticket" — you do this quietly
while you work.

All board writes go through the `board` CLI. Never edit `.board/board.json` by hand.

## The CLI

**"Open the board", "show me the board", "where's my board?", "open clipped" — or a
message that's just "clipped" (or a typo like "clippd")** → run `board ui`. A message
that only mentions Clipped while asking for something else is about that request, not this.
It opens the board in the browser (reusing the one already running) and prints its
link, usually http://clipped.localhost:4747 — give the user that link in one line.
Every project on this computer is on it, so this works from any folder. To stop it:
`board ui --stop`.

```
board ui                                       # open the board in the browser; prints its link
board context                                  # what's open, parked, in review
board list [--status parked] [--type bug|chore|question] [--all] [--json]
board show LE-3
board add "Save loops to library" [--status active] [--type bug|chore] [--next "..."] [--step "..."]... [--done-when "..."]... [--file path]...
board update LE-3 [--title ...] [--next ...] [--status ...] [--type ...] [--file path]... [--unfile path]... [--link url|commit]... [--unlink ...]...
board step LE-3 "Wire the Save button" [--done]
board park LE-3 --stopped "Where we stopped"   # saying where you stopped is required
board review LE-3 [--check "What to check"] [--link url|commit]...   # review = the user's turn to look
board done LE-3
board merge LE-15 --into LE-3
board rename "Clipped"                         # the project's name; the key stays
board area list · area add "Invoices" --path app/invoices... · area rename "Old" "New" · area rm "Name"
board update LE-3 --area "Invoices"|auto       # put one card in an area by hand; auto = back to its files

board ask "Which auth provider?" [--status active] [--next "..."]   # a question is a card
board answer LE-7 "What you found out" [--done]        # --done only if they decided

board note add brainstorm|plan|decision|reference "Title" [--body ...] [--considered ...] [--decided-by user|claude] [--url ...] [--file ...] [--card LE-3]...
board note list [--kind decision] · note show LE-N3 · note update LE-N3 ... · note link LE-N3 LE-4 · note rm LE-N3
```

The board has six tabs. Two hold cards: **Features** and **Questions**. Four
hold notes: **Brainstorms**, **Plans**, **Decisions**, **References**.

Bugs and chores are cards too, and they live in Features alongside features —
the tab holds the work, `--type` says what kind it is. Only `--type question`
moves a card to the Questions tab, and `board ask` sets that for you.

The line between them is the only rule that matters: **a card is work with a
next step; a note is something you'd otherwise scroll back through the chat to
find.** Everything else is neither, and goes nowhere.

## The brief is mine, not gospel

The summary at the start of a session is built from cards, and most of those
cards were written by you, not by the user. Anything marked `(mine)` or
`(my note)` is your own earlier guess that nobody has checked — and a guess
read back often enough starts to look like a fact.

- Check it before you build on it. If the file a note names is gone, or the
  work is already done, the card is wrong: fix it and say so in one line.
- If what you're doing now contradicts a card you wrote and the user never
  confirmed, correct the card instead of extending it.
- When an unchecked card and the user disagree, the user wins and the card
  changes — silently, no discussion.
- The brief leaves out notes nobody has checked, on purpose. `board show <key>`
  when you actually need a card's own words, rather than assuming them.
- Cards untouched for a fortnight that only you ever wrote are left out
  entirely and summed up in one line. They aren't gone; they're just no longer
  worth repeating. `board list --all` when the user asks about old work.

## What gets captured

Two questions decide every case. **Is something left to do?** Then it's a card.
**Would they scroll back through the chat for it next week?** Then it's a note,
or an answered question. Neither → nothing.

| What happened | Where it goes |
|---|---|
| You build something that takes more than one reply | a feature card, `active` |
| The user asks for several things at once | one card each; the rest `idea` |
| The user says "later we should…", "one day…", "don't forget…" | an `idea` card, title only |
| You spot a bug or chore outside the task and don't fix it | an `idea` card, `--type bug` or `chore` |
| You tell the user they have to do something — add keys, run a migration, update the plugin, click connect in a dashboard | a `chore` in `review` (their turn): see **Steps only the user can do** |
| A question someone has to go and find out later | `board ask` — Open |
| You asked the user with the multiple-choice question widget | nothing: a hook records it — a design question as a decision (their call), any other in Questions, Decided — don't add it again |
| You changed the UI | the card for the work, and a decision for any design call it made: see **Decisions** |
| A question you answered with a table, a list, a comparison or a recommendation — looked up or from memory | `board ask` then `board answer` — Answered |
| "Elaborate", "more detail", "why?" on an answer you recorded | `board answer` on the same card again — never a new one |
| A fact you knew and said in a line | nothing |
| The source an answer or the work rested on | a reference note, linked to its card |
| A call that shapes the product — a look, a word, a layout, what the docs say, what's in scope — made by them or by you | a decision note: see **Decisions** |
| A discussion that ended in a decision | a decision note, plus an `idea` for each concrete thing still to build |
| A run of small design or wording changes that settled a direction | one decision note when the run ends |
| A long discussion whose path is worth keeping, not only where it landed | a brainstorm note, linked to its decisions and ideas |
| How the project is set up — where it deploys, which account or dashboard holds what, the command that matters | a reference note |
| A plan document in the repo | cards, plus one plan note |
| A plan you wrote in chat and they approved | steps on the card, not a note |
| Thinking aloud, and anything the user turned down | nothing |

The rest of this file is the detail behind each row.

Cards can be referred to as `LE-3` or just `3`. If there's no board yet, don't
offer to make one and don't mention it: the first `board add`, `board ask` or
`board note add` creates it, named after the project folder. Just record things
as usual.

Files attach themselves as you edit, but only to a card they plausibly belong
to. When you know which card the work is for, say so: `board touch <file>
--card LE-3`, or `board update LE-3 --file <file>`.

## Outputs

When you make something the user can open — start an app (`localhost:3000`), deploy a
site, open a pull request, publish an artifact — attach its link to the card you're on:
`board update LE-3 --link http://localhost:3000`. It shows in the board's **Outputs**
tab and as an Open button on the card, so the user can get back to it without scrolling
the chat. A hook also picks such links out of your replies, but name them in the reply
the way the user would ("the app is running at http://localhost:3000"). Links to docs or
search results aren't outputs; leave them out.

## Areas

Every card shows the **area** of the product it's in — a page, a surface, a
package — worked out from its files. Until an area is named, the card's top
folder stands in (`ui/` → "UI"), shown dashed on the board. Name areas so the
board reads like the product, not the repo:

- When a folder holds work the user would call by one name, name it once:
  `board area add "Invoices" --path app/invoices`. Use their words ("Checkout"),
  not the folder's. Several paths can share an area; the most specific path wins.
- `board area list` shows what's named and what's still only a folder guess.
  Name an area when three or more cards sit under a guess.
- A card whose files mislead (a settings change for the invoice PDF) →
  `board update LE-3 --area "Invoice PDF"`.
- Don't create areas for one-off folders, and don't file cards by hand when
  their files already say where they belong. The user only corrects.

## What is a feature?

A user-visible outcome that takes more than one reply to build. Everything else
is a step inside a feature, or nothing.

For each request:

1. Related to an open card (same topic or same files)? → update that card —
   unless it's the wrong home for it, below.
2. Takes more than one reply, or touches several files? → new card.
3. Otherwise → a step on the active card, or don't record it.

- Chat, and quick facts you say in a line → record nothing. A question whose
  answer is worth coming back to is a card, even when you answer it in the same
  reply and even when you knew it: see **Questions**.
- Several asks in one message → one card each. What you work on now is `active`,
  the rest are `idea`.
- Vague asks ("make it nicer") → name the card by the screens you actually changed.
- Name cards in the user's language, as they see the app ("Save loops"), not in
  internals ("storage layer").

**When an open card is the wrong home.** A broad card — "Traffic analytics",
"The dashboard" — looks related to almost anything, and then swallows days of
distinct work as note edits. The card never finishes, and the board stops
moving even though it was technically updated. Before folding work into one:

- Would it be a fair line in that card's *next step*? If describing it takes
  more than a sentence, it's its own card.
- Does it finish separately? Shipping a signature check and shipping a browser
  snippet end on different days. Two cards.
- Is the card in `review`? Then it's waiting to be checked, not worked on.
  Move it back with `board update <key> --status active` before recording
  anything, or open a new card. Notes on a review card claim something is
  finished while you're still building it.

A note edit changes nothing the user can see: same title, same progress, same
row. If a whole session shows up only as notes on one card, the board failed.

## Questions

A question is a card when somebody has to go and find out — compare two
libraries, check what a service costs, read a spec, ask another person. It has a
next step and an end, which is what makes it work and not chatter.

`board ask "Which auth provider — Clerk or Auth.js?"`

**Answered on the spot.** Often you go and find out straight away, in the same
reply — you read the repo's data, searched, compared three options, and ended on
a recommendation. That answer is exactly what gets lost: it took work, the user
will act on it, and next week it's forty messages up. Record it, then answer it:

```
board ask "Which marketing and GTM approach should we use?" --status active
board answer BRL-7 "Free scan, paid monitoring — …"
```

Judge the answer, not how you got it. Record it when any of these is true: it's
a table, a ranked list or a comparison; it ends on a recommendation the user
will act on; you read files, data or pages to write it. An answer from memory
counts just as much as a researched one — "top 3 mobile games in each genre"
answered from what you know is still a twelve-row table they'll scroll back
for. Put the finding in the answer — what they'd need from that line alone
(the picks, the verdict) — not a summary of how you got there.

A quick fact you knew and said in a line
was never a question; it was a sentence. Don't record it. "What port does Vite use?" is a sentence. "Which of
these four competitors should we worry about?" is a question.

**Follow-ups.** "Elaborate", "go deeper", "why that one?" on an answer you
already recorded is the same question. Run `board answer` on that card again
with the fuller finding — including anything you changed your mind about — and
don't open a second card.

If the answer names work that has to happen first ("move the worker off your
Mac before launching"), that's a loose end: add it as an idea, see below.

Statuses read differently here, and the UI renames them: `idea` is **Open**,
`active` is **Looking into**, `review` is **Answered**, `done` is **Decided**.
That gap between answered and decided is deliberate — finding the answer and
choosing what to do about it are two different moments, and the second one is
the user's.

`board answer LE-7 "Clerk — device codes are built in"` records what you found
and moves the card to **Answered**. Never jump to `--done` on the user's behalf:
you answered the question, you didn't make the decision. Use `--done` only when
the user states the decision themselves in the same breath — "go with Clerk" —
and then the answer you record is theirs, not yours. When they decide, close
it — and if the decision creates work, add that card and say so in one line.

## Ideas and loose ends

An idea is a title and nothing else. It weighs nothing, so recording one is cheap.
It doesn't matter who said it first: a concrete suggestion of yours that the user
heard and didn't turn down is as much a loose end as one of theirs. What they
turned down, and what stayed a "maybe", is not.

**Said in passing.** Mid-task, the user says "later we should add dark mode" or
"don't forget the export button". That's a decision about the future, not
thinking aloud. Add it as an `idea` without asking and name it in the footer.
If they're wondering ("maybe dark mode?"), it's brainstorming: see below.

**Found while working.** You fix the login bug and notice the signup form has the
same one. You leave a TODO. You finish and tell the user "you'll need to add the
Stripe keys before this works". Each of those is a loose end: somebody has to
do it, and right now it lives only in a reply.

```
board add "Signup form drops the email on error" --type bug
board add "Add the Stripe keys in Vercel" --type chore
```

**Steps only the user can do.** Some work ends on their side: "update the plugin",
"connect the repo in Vercel", "add the Stripe keys". You can't do it, and if they
stop halfway it lives only in a reply. Make it a chore in their turn, saying
exactly what to do and where:

```
board add "Connect the repo in Vercel" --type chore --status review \
  --check "Vercel → clipped → Settings → Git → Connect, pick avivalushai/clipped"
```

When they say it's done, `board done` it. If they did it before you recorded it,
record nothing.

The test: **if it's worth a sentence in your reply, it's worth a row.** If you
wouldn't mention it to the user at all — a style nit, a naming quibble, a "could
be refactored" — it isn't a loose end, and it doesn't go on the board either.

Before adding one, check `board list --all` for it. A loose end you noticed
twice is one card.

## Brainstorming

Talk is not work. While the user is thinking out loud — weighing options, asking
what you think, wondering aloud — record nothing. A board full of musings is a
board they have to maintain, which defeats the point.

But a brainstorm that reaches concrete things and then evaporates is itself a
loose end. So when the discussion is done, add each concrete thing still to
build as an `idea` — theirs or yours, it doesn't matter who proposed it — and
name them in the footer. Title only: no steps, no done-when. An idea is a title
until someone picks it up, and deleting one costs a click.

Leave out what they turned down ("no, skip offline mode") and what never got
past a "maybe" that nobody picked up.

**Settled over many small steps.** Design and wording often settle across a dozen
small requests — this font, then that one; the terminal here, then there — and no
single message feels like a decision. When such a run ends, write one decision
note (see **Decisions**): the body is where it landed, `--considered` is what was
tried and dropped, and why. Link the card it served.

**Picked from a list.** When you laid out a list of options — a review, a set of
suggestions, a numbered menu — and the user chose some of them to do now, the
rest are "not now", not "no". Build what they picked, and add every item they
didn't pick as an `idea`, without asking. Then add one brainstorm note that links
the ideas and the card for the work they chose, so the list stays in one place.
Name the ideas in the footer. Two exceptions: anything they explicitly turned
down ("skip the phone stuff") is dropped, and if they only asked questions about
the list without choosing anything, it's still thinking aloud — record nothing.

Concrete means you could name the card: "voice input", "a Last 7 days view".
"Maybe it could feel faster" isn't one yet. If you can't tell, leave it out — a
missing idea costs one sentence to add later, a wrong one costs trust in every
row on the board.

Don't record mid-work. Wait until the discussion is done.

When the discussion was long enough that the *reasoning* is worth keeping too,
add one brainstorm note alongside the cards and link them:

```
board note add brainstorm "Should the board hold more than features?" \
  --body "Ideas and references evaporate in chat too. Settled on: questions are cards, the rest are notes." \
  --considered "Everything as cards: rejected, a reference has no next step. A wiki: rejected, nobody opens it."
board note link LE-N4 LE-12 LE-13
```

One note for the whole conversation, never one per idea. `--considered` keeps the
options that lost and why, in a line or two — it's what answers "why didn't we just…"
a month later. The body says what was
**decided**, not what was said — if you can't write a decision, there wasn't
one, and the note shouldn't exist.

**A decision with nothing to build.** Some discussions end in a choice that
creates no card — "we price at $29", "we drop Safari 15", "no ads before launch".
Nothing is left to do, but in a month nobody remembers why. When the user
states a decision like that, record it without asking, as a decision note. If it
closes an open question, `board answer <key> --done` instead: the question card
already holds it.

## Decisions

A product is a pile of calls: this blue, that label, dark by default, the README
before the install page. Most get made in passing — many by you, while building —
and the reasons evaporate with the chat. A decision note keeps each call, what
lost, and **whose call it was**.

```
board note add decision "The board is dark by default, with a light switch" \
  --body "Matches the terminal it sits next to; light is one click away." \
  --considered "Light only: flat next to the terminal. Follow the OS: surprised people on first open." \
  --card LE-51
```

Record one when a call sets a direction or a rule someone would later ask "why?"
about: a color or type choice that isn't already in the design system, a layout,
a component's behaviour, a word the UI will use everywhere, what a doc covers or
which doc is the source of truth, a scope or privacy line, a technical choice
that shapes the product. Not every hex tweak: following an existing rule is not
a decision.

- **Whose call.** It defaults to you (Claude). Add `--decided-by user` only when
  the user picked it, asked for it, or corrected you toward it. If you chose and
  they didn't weigh in, it stays yours; that is what tells them which calls
  nobody checked. When in doubt, it's yours.
- **Never confirm your own call.** `board note confirm` is the user's: they agree
  on the board. You can't run it.
- **The why is the reason given, not one you make up afterwards.** If no reason
  was given, say so in the body.
- **Alternatives you showed.** If you produced variants (mockups, two layouts,
  three palettes), name each one in `--considered` with why it lost. If a
  variant exists as a file in the repo, point `--file` at it.
- **One call per note.** A long discussion that settled five things is five
  decisions and, if the path matters, one brainstorm note linking them.
- A decision that turns out wrong isn't deleted: update it, and say what changed
  in the body.

**UI changes.** A UI change is two things on the board: the card for the work (it
lands in the UI area through its files), and a decision for each design call the
change made. A change that only reuses what `DESIGN.md` already has — its colors,
fonts, tokens — made no call, and needs no decision. When a UI edit brings in a
color, a typeface or a token that `DESIGN.md` doesn't have, the end-of-turn hook
names them and asks: record the decision, or say in one line that it followed the
existing design. If the project has a `DESIGN.md` and the call changes the design
system itself, update `DESIGN.md` too, so the next reuse counts as following it.

## References

A reference is something the user looked up that they'll look up again: the doc
page that answered a question, the spec you worked from, the example repo.

`board note add reference "Clerk device-code flow" --url https://... --card LE-7`

Add one when you *used* a source and the user would otherwise have to scroll
back through the chat for it. Link it to the card it informed.

When you answer a question from outside sources, add the one or two the answer
actually rests on and link them to the question card — not every page you
opened. Sources inside the repo need no note: point the card at them with
`--file`.

**How it's set up.** Where the site deploys, which dashboard a setting lives in,
which account owns the domain, the one command that deploys by hand — none of it
is work, and all of it is gone from memory in a month. Record it as one reference
note per system, `--url` pointing at the dashboard or the live address, the body
saying what's configured where. Update the same note when the setup changes.

Do not record: links you produced in passing, anything already in the repo's
README, search results nobody opened, or a page you only skimmed. A references
tab that fills up on its own is a bookmarks folder, and nobody reads those.

## Plans and specs

A planning document is not a board, but it usually contains one. When the user
has written a plan, a spec or a feature list and asks for it on the board — or
when they've clearly just finished planning and the board is empty — offer to
turn it into cards:

`From docs/plan.md — 6 features: …. 2 already on the board. Add the other 4 as ideas?`

Rules that keep it useful:

- Extract what would be user-visible work. Background, reasoning, competitor
  notes and evidence belong in the doc, not on the board.
- **An unchecked checklist is work, whatever section it sits under.** "Open
  questions", "to decide", "follow-ups" — each unticked box is something someone
  has to do, sitting in a document nobody reopens. A ticked box is already done:
  leave it. Which kind of card depends on what the box asks for:
  - going and finding something out — a price, whether a rival already does it,
    what a spec allows → `board ask "..."`
  - doing something — a decision to make, a job to run, a cleanup →
    `board add "..." --type chore`
- Check `board list --all --json` first and skip what's already there, matching
  on meaning rather than exact titles. Plans get re-read; cards must not double.
- Add each with `--file <the doc>` so the card points back at the reasoning.
- Then record the document itself once, and link the cards it produced:
  `board note add plan "Loop library spec" --file docs/plan.md --card LE-4 --card LE-5`
  Re-reading the same plan later, `board note list --kind plan` tells you it's
  already been through the board, which is how you avoid adding it twice.
- Never edit the document to match the board. The doc holds the thinking; the
  board holds the state.

A plan you write yourself in the chat — in plan mode, or "here's how I'll do
it" — is not a document. When the user approves it, it becomes the card: each
step a `--step`, its end state the `--done-when`. No plan note: that's for
files that live in the repo, which the user will open again.

## Statuses

`idea` · `active` · `parked` · `review` · `done`

The card carries one line of text whose meaning changes with the status, which
is why each status has its own flag for it: `--next` while active, `--stopped`
when parking, `--check` when sending it to review. `--note` still works and
means the same field. The UI calls `review` **Your turn**, because it is.

The note means something different in each: **next step** when active, **where we
stopped** when parked, **what to check** in review. Write it so the user can pick
the work up cold, weeks later — name the file or the exact next action, not
"continue work".

When you send a card to review, give the user something to check it *with*:
`--link` the commit hash, the PR, or the page where the change shows. The UI turns
a commit hash into a link to the repo. One or two links, not every commit.

When the user switches topics, close the loop on the current card first:
- looks finished → `board review`, and ask one short question
- unfinished → `board park --stopped "..."` saying exactly where you stopped

Parked cards are the heart of this product. Never leave work in `active` when
you've moved on, and never park without a real note.

## Finishing

When you open a card, write `--done-when` — what has to be true for it to count
as finished. Signals that it's done, strongest first:

1. The user says it works, or runs `/done` → `done`
2. Merged to main or deployed → `done`, mention it in one line
3. All steps done and tests pass → `review`, ask if they checked it
4. The user moved on → ask: finished, or park it?
5. A card has sat in review for days → mention it at the next session start

Never move a card to `done` on a guess. Review is where uncertainty goes.

## Before you end a turn

A decision, a loose end or a step for the user leaves no diff. The end-of-turn
hook only catches code that changed without the board — nothing catches the
rest, so check yourself before your last line:

- Did something get **decided** — by them or by you, even across many small replies? → a decision note
- Did you **mention** something left to do — a bug, a chore, a "you'll need to"? → a card
- Is there a **step only the user can do**? → a chore in their turn
- Did a **suggestion** get discussed and not turned down? → an idea
- Did you learn **how something is set up**? → a reference note

Then write the footer.

## The footer

End every reply where the board changed with exactly one line:

`Board: LE-3 Save loops → in progress · new idea: LE-15 Bigger buttons on mobile`

Notes and questions go in the same one line, never a second one:

`Board: LE-7 answered — Clerk · reference LE-N4 Clerk device-code flow`
`Board: LE-9 Checkout → review · loose end: LE-16 Add the Stripe keys in Vercel`

Nothing else about the board in your reply — no summaries, no bullet lists of
what you recorded. If the user corrects you ("that's part of saving"), fix it
silently with `board update` or `board merge` and don't explain.
