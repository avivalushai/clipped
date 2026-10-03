import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Env } from "../src/context.js";
import { type Sandbox, sandbox, withBoard } from "./helpers.js";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");
const readJson = (p: string) => JSON.parse(read(p));

/** Run a hook script the way Claude Code does: JSON on stdin, JSON or nothing on stdout. */
/** Runs a hook; `code` 2 with `err` is how the Stop hook keeps Claude going. */
function runHook(script: string, input: unknown, env: Env = {}) {
  const r = spawnSync(process.execPath, [path.join(repo, "hooks", script)], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...env } as NodeJS.ProcessEnv,
  });
  const out = r.stdout ?? "";
  return { raw: out, json: out.trim() ? JSON.parse(out) : null, code: r.status, err: r.stderr ?? "" };
}

describe("plugin manifests", () => {
  it("puts plugin.json in .claude-plugin/ and every component directory at the plugin root", () => {
    const m = readJson(".claude-plugin/plugin.json");
    expect(m.name).toBe("clipped");
    expect(m.description).toBeTruthy();
    for (const dir of ["skills", "commands", "hooks", "bin"]) {
      expect(fs.existsSync(path.join(repo, dir))).toBe(true);
      expect(fs.existsSync(path.join(repo, ".claude-plugin", dir))).toBe(false);
    }
    // relative component paths must start with ./
    if (m.hooks) expect(String(m.hooks).startsWith("./")).toBe(true);
    expect(fs.existsSync(path.join(repo, String(m.hooks ?? "hooks/hooks.json")))).toBe(true);
  });

  it("describes this plugin in the marketplace manifest", () => {
    const mk = readJson(".claude-plugin/marketplace.json");
    expect(mk.name).toBeTruthy();
    expect(mk.owner?.name).toBeTruthy();
    expect(mk.plugins).toHaveLength(1);
    const p = mk.plugins[0];
    expect(p.name).toBe(readJson(".claude-plugin/plugin.json").name);
    expect(p.description).toBeTruthy();
    expect(p.source).toBe("./"); // the plugin is this repo
  });
});

describe("skill and commands", () => {
  const frontmatter = (text: string): Record<string, string> => {
    const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
    expect(m, "file must start with YAML frontmatter").toBeTruthy();
    const body = m?.[1] ?? "";
    return Object.fromEntries(
      body.split("\n").filter((l) => /^[\w-]+:/.test(l)).map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1).trim()]),
    );
  };

  it("ships one skill with a description that says when to use it", () => {
    const fm = frontmatter(read("skills/clipped/SKILL.md"));
    expect(fm.name).toBe("clipped");
    expect((fm.description ?? "").length).toBeGreaterThan(40);
    expect((fm.description ?? "").length).toBeLessThan(1024);
  });

  it("teaches the rules that matter, in the CLI's real vocabulary", () => {
    const body = read("skills/clipped/SKILL.md");
    for (const rule of ["board park", "board review", "board merge", "--done-when", "Board:"]) expect(body).toContain(rule);
    for (const status of ["idea", "active", "parked", "review", "done"]) expect(body).toContain(status);
  });

  it("says how to turn a plan document into cards without duplicating them", () => {
    const body = read("skills/clipped/SKILL.md");
    expect(body).toContain("A planning document is not a board");
    expect(body).toContain("skip what's already there");
    expect(body).toContain("--file <the doc>");
    expect(body).toContain("An unchecked checklist is work");
    expect(read("commands/plan.md")).toContain("--type chore");
    expect(read("commands/plan.md")).toContain("board list --all --json");
  });

  it("says what to do with a brainstorm: nothing while it's talk, ideas once it lands", () => {
    const body = read("skills/clipped/SKILL.md");
    expect(body).toContain("Talk is not work");
    // concrete things become ideas without asking, whoever proposed them
    expect(body).toContain("theirs or yours, it doesn't matter who proposed it");
    expect(body).toContain("Leave out what they turned down");
    expect(body).toContain("Settled over many small steps");
    expect(body).toContain("Picked from a list");
  });

  it("draws the line between a card and a note, so the board can't fill up on its own", () => {
    const body = read("skills/clipped/SKILL.md");
    expect(body).toContain("a card is work with a\nnext step");
    expect(body).toContain("scroll back through the chat to\nfind");
    // questions stop at answered; deciding is the user's move
    expect(body).toContain("board ask");
    expect(body).toContain("board answer");
    expect(body).toContain("you answered the question, you didn't make the decision");
    // and the three note kinds each say what does NOT belong
    expect(body).toContain("was never a question; it was a sentence");
    expect(body).toContain("One note for the whole conversation, never one per idea");
    expect(body).toContain("Do not record: links you produced in passing");
  });

  it("records a researched answer and the loose ends a reply leaves behind", () => {
    const body = read("skills/clipped/SKILL.md");
    expect(body).toContain("## What gets captured");
    // an answer that took work lands in Answered, a fact you knew doesn't
    expect(body).toContain("Answered on the spot");
    expect(body).toContain("`board ask` then `board answer`");
    // things somebody still has to do become cards; a step only the user can do is their turn
    expect(body).toContain("if it's worth a sentence in your reply, it's worth a row");
    expect(body).toContain("It doesn't matter who said it first");
    expect(body).toContain("Steps only the user can do");
    expect(body).toContain("A decision with nothing to build");
    // setup facts and the self-check that catches what leaves no diff
    expect(body).toContain("How it's set up");
    expect(body).toContain("## Before you end a turn");
  });

  it("gives every command a description and only refers to real board commands", () => {
    const files = fs.readdirSync(path.join(repo, "commands"));
    expect(files.sort()).toEqual(["board.md", "done.md", "park.md", "plan.md", "question.md"]);
    const known = /board (ui|init|context|list|show|add|update|step|park|review|done|merge|touch|ask|answer|note)\b/g;
    for (const f of files) {
      const text = read(`commands/${f}`);
      const fm = frontmatter(text);
      expect(fm.description, f).toBeTruthy();
      for (const call of text.match(/`board [a-z]+/g) ?? []) expect(`${call}\``.replace(/`/g, "")).toMatch(/board \w+/);
      expect(text.match(known), f).not.toBeNull();
    }
  });
});

describe("hooks.json", () => {
  const cfg = () => readJson("hooks/hooks.json").hooks;

  it("wires the three events from SPEC §5 to executable scripts", () => {
    const h = cfg();
    expect(Object.keys(h).sort()).toEqual(["PostToolUse", "SessionStart", "Stop"]);
    for (const entries of Object.values(h) as any[])
      for (const e of entries)
        for (const hook of e.hooks) {
          expect(hook.type).toBe("command");
          expect(hook.command).toContain("${CLAUDE_PLUGIN_ROOT}");
          const script = path.join(repo, hook.command.replace(/"?\$\{CLAUDE_PLUGIN_ROOT\}"?\//, ""));
          expect(fs.existsSync(script), hook.command).toBe(true);
          fs.accessSync(script, fs.constants.X_OK);
          expect(fs.readFileSync(script, "utf8").startsWith("#!/usr/bin/env node")).toBe(true);
          expect(hook.timeout).toBeGreaterThan(0);
        }
  });

  it("matches only the file-editing tools, and matches nothing for the other events", () => {
    const h = cfg();
    expect(h.PostToolUse[0].matcher).toBe("Edit|Write|NotebookEdit");
    for (const name of ["Edit", "Write", "NotebookEdit"]) expect(new RegExp(`^(${h.PostToolUse[0].matcher})$`).test(name)).toBe(true);
    for (const name of ["Read", "Bash", "Glob"]) expect(new RegExp(`^(${h.PostToolUse[0].matcher})$`).test(name)).toBe(false);
    expect(h.SessionStart[0].matcher).toBeUndefined();
    expect(h.Stop[0].matcher).toBeUndefined();
    // the multiple-choice question widget has its own hook
    expect(h.PostToolUse[1].matcher).toBe("AskUserQuestion");
    expect(h.PostToolUse[1].hooks[0].command).toContain("hooks/asked.mjs");
  });
});

describe("hook behaviour", () => {
  it("SessionStart injects the board summary as additionalContext", () => {
    const sb = withBoard();
    sb.board("add", "Save loops", "--status", "active", "--next", "Wire Save", "--by", "user");
    sb.board("add", "Mobile layout", "--status", "parked", "--note", "Header overlaps");

    const { json } = runHook("session-start.mjs", { hook_event_name: "SessionStart", session_id: "s1", cwd: sb.root });
    expect(json.hookSpecificOutput.hookEventName).toBe("SessionStart");
    const ctx = json.hookSpecificOutput.additionalContext;
    expect(ctx).toContain("Clipped board: My App (APP)");
    expect(ctx).toContain("APP-1 Save loops — next: Wire Save");
    expect(ctx).toContain("APP-2 Mobile layout (mine) — stopped (my note): Header overlaps");
    expect(ctx).toContain("clipped skill");
  });

  it("SessionStart without a board tells Claude one comes on the first card, and not to ask", () => {
    const bare = sandbox();
    const ctx = runHook("session-start.mjs", { hook_event_name: "SessionStart", session_id: "s1", cwd: bare.root }).json
      .hookSpecificOutput.additionalContext;
    expect(ctx).toContain("Don't offer to create one");
    expect(ctx).toContain("`board ask`");
    expect(ctx).not.toMatch(/offer once/i);
  });

  describe("a question asked with the multiple-choice widget", () => {
    const ask = (sb: Sandbox, answers: Record<string, string>) =>
      runHook("asked.mjs", {
        hook_event_name: "PostToolUse", session_id: "q1", cwd: sb.root, tool_name: "AskUserQuestion",
        tool_input: { questions: [
          { question: "Which auth provider?", header: "Auth", multiSelect: false, options: [
            { label: "Keep Clerk", description: "Ship as built" },
            { label: "Auth0", description: "Move the login over and migrate users" },
          ] },
          { question: "Postgres or SQLite for the cache?", header: "Storage", multiSelect: false, options: [
            { label: "Postgres", description: "" }, { label: "SQLite", description: "" },
          ] },
        ] },
        tool_response: { answers },
      }, { CLIPPED_HOME: sb.home, CLIPPED_NOW: sb.env.CLIPPED_NOW as string });
    const questions = (sb: Sandbox) => sb.read().features.filter((f: { type: string }) => f.type === "question");

    it("lands in Questions as decided, with the pick and the options not taken", () => {
      const sb = withBoard();
      ask(sb, { "Which auth provider?": "Auth0", "Postgres or SQLite for the cache?": "Something else entirely" });
      const [a, b] = questions(sb);
      expect(a).toMatchObject({ title: "Which auth provider?", status: "done", updatedBy: "user" });
      expect(a.note).toBe("Auth0 — Move the login over and migrate users. Other options: Keep Clerk");
      expect(b.note).toContain("Something else entirely. (their own answer)");
    });

    it("keeps an unanswered question open, and never adds the same question twice", () => {
      const sb = withBoard();
      ask(sb, { "Which auth provider?": "Keep Clerk" });
      expect(questions(sb).map((f: { status: string }) => f.status)).toEqual(["done", "idea"]);
      ask(sb, { "Postgres or SQLite for the cache?": "Postgres" });
      expect(questions(sb)).toHaveLength(2);
      expect(questions(sb)[1]).toMatchObject({ status: "done", note: "Postgres. Other options: SQLite" });
    });

    it("a design pick lands in the Design tab as the user's call, not in Questions", () => {
      const sb = withBoard();
      runHook("asked.mjs", {
        hook_event_name: "PostToolUse", session_id: "q2", cwd: sb.root, tool_name: "AskUserQuestion",
        tool_input: { questions: [{ question: "Which theme is the default?", header: "Theme", multiSelect: false, options: [
          { label: "Keep dark", description: "Ship as built" },
          { label: "Light default", description: "Flip it and retune the light palette" },
        ] }] },
        tool_response: { answers: { "Which theme is the default?": "Light default" } },
      }, { CLIPPED_HOME: sb.home, CLIPPED_NOW: sb.env.CLIPPED_NOW as string });
      expect(questions(sb)).toHaveLength(0);
      expect(sb.read().notes).toMatchObject([{
        kind: "decision", title: "Which theme is the default: Light default", decidedBy: "user",
        body: "Light default — Flip it and retune the light palette. Picked from the options Claude showed.",
        considered: "Keep dark — Ship as built",
      }]);
    });
  });

  describe("a UI change that brings in new design values", () => {
    const setup = async () => {
      const sb = withBoard();
      delete sb.env.CLIPPED_NOW;
      sb.board("add", "Restyle the pills", "--status", "active");
      fs.writeFileSync(path.join(sb.root, "DESIGN.md"), "accent #2F5BFF, font Geist, token --ground");
      await new Promise((r) => setTimeout(r, 1100)); // board times have second resolution
      const env = { CLAUDE_PLUGIN_DATA: sb.home };
      const edit = (file: string, new_string: string) => runHook("post-tool-use.mjs", {
        session_id: "d1", cwd: sb.root, tool_name: "Edit", tool_input: { file_path: path.join(sb.root, file), old_string: "x", new_string },
      }, env);
      const stop = (turn: string) => runHook("stop.mjs", { session_id: "d1", cwd: sb.root, prompt_id: turn }, env);
      return { sb, edit, stop };
    };

    it("asks for a design decision, naming the values DESIGN.md doesn't have", async () => {
      const { sb, edit, stop } = await setup();
      edit("ui/app.css", ".pill{color:#2f5bff;background:#FFB020;font-family:'Inter',sans-serif}\n:root{--hover:#eee}");
      sb.board("update", "APP-1", "--note", "Pills restyled"); // the card moved, so only the design half is left
      const r = stop("p1");
      expect(r.code).toBe(2);
      expect(r.err).not.toContain("Code changed");
      expect(r.err).toContain("aren't in DESIGN.md (color #ffb020, color #eee, font Inter, token --hover)");
      expect(r.err).not.toContain("#2f5bff");
    });

    it("stays quiet when the UI only reuses the design, or a decision was recorded", async () => {
      const { sb, edit, stop } = await setup();
      edit("ui/app.css", ".pill{color:#2F5BFF;font-family:Geist;background:var(--ground)}");
      edit("src/store.ts", "const c = '#123456'"); // not a UI file
      sb.board("update", "APP-1", "--note", "Pills restyled");
      expect(stop("p1").code).toBe(0);

      edit("ui/app.css", ".pill{color:#FFB020}");
      sb.board("update", "APP-1", "--note", "Amber pills");
      await new Promise((r) => setTimeout(r, 1100));
      sb.board("note", "add", "decision", "Pills are amber", "--decided-by", "user");
      expect(stop("p2").code).toBe(0);
    });
  });

  it("PostToolUse attaches the edited file to the active card", () => {
    const sb = withBoard();
    sb.board("add", "Save loops", "--status", "active");
    const file = path.join(sb.root, "src/store/library.ts");

    runHook("post-tool-use.mjs", {
      hook_event_name: "PostToolUse",
      session_id: "s2",
      cwd: sb.root,
      tool_name: "Edit",
      tool_input: { file_path: file },
    }, { CLAUDE_PLUGIN_DATA: sb.home });

    expect(sb.read().features[0].files).toEqual(["src/store/library.ts"]);
  });

  it("PostToolUse stays silent when there is no board", () => {
    const bare = sandbox();
    const r = runHook("post-tool-use.mjs", {
      hook_event_name: "PostToolUse",
      session_id: "s3",
      cwd: bare.root,
      tool_name: "Write",
      tool_input: { file_path: path.join(bare.root, "a.ts") },
    }, { CLAUDE_PLUGIN_DATA: bare.home });
    expect(r.raw).toBe("");
  });

  it("Stop blocks once when code changed but the board didn't", async () => {
    const sb = withBoard();
    delete sb.env.CLIPPED_NOW; // the Stop check compares card-log times against real edit times
    sb.board("add", "Save loops", "--status", "active");
    const env = { CLAUDE_PLUGIN_DATA: sb.home };
    const stop = () => runHook("stop.mjs", { hook_event_name: "Stop", session_id: "s4", cwd: sb.root }, env);

    expect(stop().raw).toBe(""); // nothing edited yet

    // Card-log timestamps have second resolution, and a board change in the same second
    // as an edit counts as "already updated" — so step past that window deliberately.
    await new Promise((r) => setTimeout(r, 1100));

    // an edit the board doesn't know about (touch rewrites board.json, but logs nothing)
    fs.writeFileSync(path.join(sb.root, "notes.md"), "x");
    runHook("post-tool-use.mjs", {
      session_id: "s4", cwd: sb.root, tool_name: "Write", tool_input: { file_path: path.join(sb.root, "notes.md") },
    }, env);
    const blocked = stop();
    expect(blocked.code).toBe(2);
    expect(blocked.err).toContain("Code changed but the Clipped board didn't");
    expect(stop().code).toBe(0); // never twice for the same edit
  });

  it("Stop keeps quiet once the board has moved, and while a Stop hook is already blocking", () => {
    const sb = withBoard();
    delete sb.env.CLIPPED_NOW;
    sb.board("add", "Save loops", "--status", "active");
    const env = { CLAUDE_PLUGIN_DATA: sb.home };
    runHook("post-tool-use.mjs", {
      session_id: "s5", cwd: sb.root, tool_name: "Edit", tool_input: { file_path: path.join(sb.root, "src/a.ts") },
    }, env);

    sb.board("update", "APP-1", "--note", "Wired the Save button"); // board moves after the edit
    expect(runHook("stop.mjs", { session_id: "s5", cwd: sb.root }, env).raw).toBe("");
    expect(runHook("stop.mjs", { session_id: "s5", cwd: sb.root, stop_hook_active: true }, env).raw).toBe("");
  });

  it("Stop no longer reads the reply: a loose end in words alone doesn't block", () => {
    const sb = withBoard();
    delete sb.env.CLIPPED_NOW;
    const env = { CLAUDE_PLUGIN_DATA: sb.home };
    const r = runHook("stop.mjs", {
      hook_event_name: "Stop", session_id: "t1", cwd: sb.root, prompt_id: "p1",
      last_assistant_message: "Done. You'll need to add the Stripe keys in Vercel. We decided to drop Safari 15.",
    }, env);
    expect(r.code).toBe(0);
    expect(r.raw).toBe("");
  });

  it("Stop nudges at most once per turn, even after more edits", async () => {
    const sb = withBoard();
    delete sb.env.CLIPPED_NOW;
    sb.board("add", "Save loops", "--status", "active");
    const env = { CLAUDE_PLUGIN_DATA: sb.home };
    const edit = (file: string) => runHook("post-tool-use.mjs", {
      session_id: "t2", cwd: sb.root, tool_name: "Edit", tool_input: { file_path: path.join(sb.root, file) },
    }, env);
    const stop = (turn: string) => runHook("stop.mjs", { hook_event_name: "Stop", session_id: "t2", cwd: sb.root, prompt_id: turn }, env);
    await new Promise((r) => setTimeout(r, 1100)); // card logs have second resolution
    edit("src/a.ts");
    expect(stop("p1").code).toBe(2);
    await new Promise((r) => setTimeout(r, 10));
    edit("src/b.ts");
    expect(stop("p1").code).toBe(0); // same turn, already nudged
    expect(stop("p2").code).toBe(2); // the unrecorded edit is still caught next turn
  });

  it("Stop asks once per session for a first card when a project with no board gets code", () => {
    const sb = sandbox();
    const env = { CLAUDE_PLUGIN_DATA: sb.home };
    const stop = (turn: string) => runHook("stop.mjs", { hook_event_name: "Stop", session_id: "nb1", cwd: sb.root, prompt_id: turn }, env);
    expect(stop("p1").code).toBe(0); // nothing edited yet

    runHook("post-tool-use.mjs", {
      session_id: "nb1", cwd: sb.root, tool_name: "Write", tool_input: { file_path: path.join(sb.root, "src/app.ts") },
    }, env);
    const r = stop("p2");
    expect(r.code).toBe(2);
    expect(r.err).toContain("no Clipped board yet");
    expect(stop("p3").code).toBe(0); // once per session, not every turn

    // a file outside the project doesn't count
    const other = { ...env };
    runHook("post-tool-use.mjs", {
      session_id: "nb2", cwd: sb.root, tool_name: "Write", tool_input: { file_path: path.join(sb.home, "x.ts") },
    }, other);
    expect(runHook("stop.mjs", { session_id: "nb2", cwd: sb.root, prompt_id: "p1" }, other).code).toBe(0);
  });

  it("survives junk input instead of breaking the session", () => {
    for (const script of ["session-start.mjs", "post-tool-use.mjs", "stop.mjs"]) {
      const out = execFileSync(process.execPath, [path.join(repo, "hooks", script)], { input: "not json", encoding: "utf8" });
      expect(out).toBe("");
    }
  });
});

describe("the outputs hook", () => {
  const reply = (sb: any, text: string) =>
    runHook("outputs.mjs", { hook_event_name: "Stop", session_id: "o1", cwd: sb.root, last_assistant_message: text }, sb.env);

  it("attaches links to things Claude made to the card being worked on", () => {
    const sb = withBoard();
    sb.board("add", "Old idea");
    sb.board("add", "Recipe app", "--status", "active");
    const r = reply(sb, [
      "The app is running at http://localhost:3000/recipes.",
      "Preview: https://recipes-git-main.vercel.app and the PR is https://github.com/me/recipes/pull/42.",
      "See the docs at https://react.dev/learn and open the board at http://clipped.localhost:4747.",
    ].join("\n"));
    expect(r.code).toBe(0);
    const card = sb.read().features.find((f: any) => f.title === "Recipe app");
    expect(card.links).toEqual([
      "http://localhost:3000/recipes",
      "https://recipes-git-main.vercel.app",
      "https://github.com/me/recipes/pull/42",
    ]);
    expect(sb.read().features.find((f: any) => f.title === "Old idea").links).toEqual([]);
  });

  it("adds a link once, and does nothing when no card is in progress or in review", () => {
    const sb = withBoard();
    sb.board("add", "Recipe app", "--status", "active");
    reply(sb, "Running at http://localhost:3000");
    reply(sb, "Still at http://localhost:3000");
    expect(sb.read().features[0].links).toEqual(["http://localhost:3000"]);

    const idle = withBoard();
    idle.board("add", "Someday");
    reply(idle, "Running at http://localhost:5173");
    expect(idle.read().features[0].links).toEqual([]);
  });
});
