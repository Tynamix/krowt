#!/usr/bin/env node

import { runSession } from "./session.js";

export interface ParsedArgs {
  command: "session" | "help";
  branch?: string;
  base?: string;
}

export function parseArgs(argv: string[]): ParsedArgs {
  let branch: string | undefined;
  let base: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--base") {
      base = argv[++i];
      if (base === undefined) throw new Error("--base requires a ref");
    } else if (arg === "--help" || arg === "-h") {
      return { command: "help" };
    } else if (arg.startsWith("-")) {
      throw new Error(`unknown flag: ${arg}`);
    } else if (branch === undefined) {
      branch = arg;
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  if (branch === undefined) return { command: "help" };
  const parsed: ParsedArgs = { command: "session", branch };
  if (base !== undefined) parsed.base = base;
  return parsed;
}

async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if (parsed.command === "help") {
    process.stderr.write("usage: krowt <branch> [--base <ref>]\n");
    return parsed.branch ? 1 : 0;
  }
  return runSession(parsed.branch!, parsed.base !== undefined ? { base: parsed.base } : {});
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: Error) => {
    process.stderr.write(`krowt: ${err.message}\n`);
    process.exitCode = 1;
  });
