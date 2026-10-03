#!/usr/bin/env node
// UserPromptSubmit: the user handed over a plan file laid out in phases
// ("@~/Downloads/PLAN.md Build this"). Remind Claude to record it as a step
// plan before Phase 1, and remember it so the Stop hook can check it was.
import { findBoardFile, emit, readState, safely, writeState } from "./lib.mjs";
import { handedPlan, planRecorded } from "./plans.mjs";

safely(async (input) => {
  const cwd = input.cwd || process.cwd();
  const plan = handedPlan(input.prompt, cwd);
  if (!plan) return;
  const at = Date.now();
  if (planRecorded(findBoardFile(cwd), { ...plan, at: Infinity })) return; // already on the board
  if (readState(input.session_id).handedPlan?.path === plan.path) return; // said once already
  writeState(input.session_id, { handedPlan: { ...plan, at }, handedPlanNudged: false });
  emit({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: `Clipped: ${plan.path} is a plan in ${plan.phases} phases. Before starting the first phase, record it as a step plan — one --step per phase, the file's path in --body (see "A plan you're handed" in the clipped skill). The first note makes the board if there isn't one.`,
    },
  });
});
