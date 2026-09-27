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

```
board context                                  # what's open, parked, in review
board list [--status parked] [--type bug|chore|question] [--all] [--json]
board show LE-3
board add "Save loops to library" [--status active] [--type bug|chore] [--next "..."] [--step "..."]... [--done-when "..."]... [--file path]...
board update LE-3 [--title ...] [--note ...] [--status ...] [--type ...] [--file path]... [--unfile path]...
board step LE-3 "Wire the Save button" [--done]
board park LE-3 --note "Where we stopped"      # a note is required
board review LE-3 [--note "What to check"]
board done LE-3
board merge LE-15 --into LE-3

board ask "Which auth provider?" [--status active] [--note "..."]   # a question is a card
board answer LE-7 "What you found out" [--done]        # --done only if they decided

board note add brainstorm|plan|reference "Title" [--body ...] [--url ...] [--file ...] [--card LE-3]...
board note list [--kind plan] · note show LE-N3 · note update LE-N3 ... · note link LE-N3 LE-4 · note rm LE-N3
```

The board has five tabs. Two hold cards: **Features** and **Questions**. Three
hold notes: **Brainstorms**, **Plans**, **References**.

Bugs and chores are cards too, and they live in Features alongside features —
the tab holds the work, `--type` says what kind it is. Only `--type question`
moves a card to the Questions tab, and `board ask` sets that for you.

The line between them is the only rule that matters: **a card is work with a
next step; a note is something you'd otherwise scroll back through the chat to
find.** Everything else is neither, and goes nowhere.

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
| You tell the user they have to do something — add keys, run a migration, move a service first | an `idea` card, `--type chore` |
| A question someone has to go and find out later | `board ask` — Open |
| A question you answered with a table, a list, a comparison or a recommendation — looked up or from memory | `board ask` then `board answer` — Answered |
| "Elaborate", "more detail", "why?" on an answer you recorded | `board answer` on the same card again — never a new one |
| A fact you knew and said in a line | nothing |
| The source an answer or the work rested on | a reference note, linked to its card |
| A discussion that ended in a decision | a brainstorm note (and ideas, if they say yes) |
| A plan document in the repo | cards, plus one plan note |
| A plan you wrote in chat and they approved | steps on the card, not a note |
| Thinking aloud, options nobody chose, your own suggestions they ignored | nothing |

The rest of this file is the detail behind each row.

Cards can be referred to as `LE-3` or just `3`. If there's no board yet, don't
offer to make one and don't mention it: the first `board add`, `board ask` or
`board note add` creates it, named after the project folder. Just record things
as usual.

Files attach themselves as you edit, but only to a card they plausibly belong
to. When you know which card the work is for, say so: `board touch <file>
--card LE-3`, or `board update LE-3 --file <file>`.

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

An idea is a title and nothing else. It weighs nothing, so recording one is cheap —
but only the user's intentions become ideas, never your own suggestions.

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

The test: **if it's worth a sentence in your reply, it's worth a row.** If you
wouldn't mention it to the user at all — a style nit, a naming quibble, a "could
be refactored" — it isn't a loose end, and it doesn't go on the board either.

Before adding one, check `board list --all` for it. A loose end you noticed
twice is one card.

## Brainstorming

Talk is not work. While the user is thinking out loud — weighing options, asking
what you think, wondering aloud — record nothing. A board full of musings is a
board they have to maintain, which defeats the point.

But a brainstorm that reaches decisions and then evaporates is itself a loose
end. So when a conversation lands on concrete things to build, offer once, in
one line, and name them in the user's own words:

`Want these on the board as ideas? — voice input · offline mode · shared lists`

- Yes → `board add "..."` for each, status `idea`, title only. No steps, no
  done-when: an idea is a title until someone picks it up.
- No, or no answer → drop it and don't ask again this session.

Only offer for things the user actually settled on. "Maybe we could do voice
input" is thinking aloud; "right, voice input's in" is a decision. If you can't
tell which it was, leave it out of the list — a missing idea costs one sentence
to add later, a wrong one costs trust in every row on the board.

Never offer in the middle of work. Wait until the discussion is done.

When they say yes and the discussion was long enough that the *reasoning* is
worth keeping too, add one brainstorm note alongside the cards and link them:

```
board note add brainstorm "Should the board hold more than features?" \
  --body "Ideas and references evaporate in chat too. Settled on: questions are cards, the rest are notes."
board note link LE-N4 LE-12 LE-13
```

One note for the whole conversation, never one per idea. The body says what was
**decided**, not what was said — if you can't write a decision, there wasn't
one, and the note shouldn't exist.

**A decision with nothing to build.** Some discussions end in a choice that
creates no card — "we price at $29", "we drop Safari 15", "no ads before launch".
Nothing is left to do, but in a month nobody remembers why. When the user
states a decision like that, record it without asking, as one brainstorm note
whose body is the decision and the reason in a sentence or two. If it closes an
open question, `board answer <key> --done` instead: the question card already
holds it.

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

The note means something different in each: **next step** when active, **where we
stopped** when parked, **what to check** in review. Write it so the user can pick
the work up cold, weeks later — name the file or the exact next action, not
"continue work".

When the user switches topics, close the loop on the current card first:
- looks finished → `board review`, and ask one short question
- unfinished → `board park --note "..."` saying exactly where you stopped

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

## The footer

End every reply where the board changed with exactly one line:

`Board: LE-3 Save loops → in progress · new idea: LE-15 Bigger buttons on mobile`

Notes and questions go in the same one line, never a second one:

`Board: LE-7 answered — Clerk · reference LE-N4 Clerk device-code flow`
`Board: LE-9 Checkout → review · loose end: LE-16 Add the Stripe keys in Vercel`

Nothing else about the board in your reply — no summaries, no bullet lists of
what you recorded. If the user corrects you ("that's part of saving"), fix it
silently with `board update` or `board merge` and don't explain.
