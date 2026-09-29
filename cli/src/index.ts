#!/usr/bin/env node
import { run } from "./cli.js";
import { handoff } from "./handoff.js";

const argv = process.argv.slice(2);
process.exitCode = run(argv, {
  cwd: process.cwd(),
  env: process.env,
  out: (l) => process.stdout.write(l + "\n"),
  err: (l) => process.stderr.write(l + "\n"),
  handoff: () => handoff(process.argv[1] ?? "", argv, process.env),
});
