#!/usr/bin/env node

import { resolveConfig, type ConfigFlags } from "./config.js";
import { repoRoot } from "./git.js";
import { runSession } from "./session.js";

export interface ParsedArgs extends ConfigFlags {
  command: "session" | "help";
  branch?: string;
  base?: string;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { command: "help" };
  let branch: string | undefined;
  const takeValue = (flag: string, value: string | undefined): string => {
    if (value === undefined) throw new Error(`${flag} requires a value`);
    return value;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--base") {
      parsed.base = takeValue(arg, argv[++i]);
    } else if (arg === "--agent") {
      parsed.agent = takeValue(arg, argv[++i]);
    } else if (arg === "--git-ui") {
      parsed.gitUi = takeValue(arg, argv[++i]);
    } else if (arg === "--worktree-dir") {
      parsed.worktreeDir = takeValue(arg, argv[++i]);
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
  if (branch !== undefined) {
    parsed.command = "session";
    parsed.branch = branch;
  }
  return parsed;
}

async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if (parsed.command === "help") {
    process.stderr.write("usage: krowt <branch> [--base <ref>]\n");
    return parsed.branch ? 1 : 0;
  }
  const repo = await repoRoot(process.cwd());
  const config = resolveConfig(repo, parsed);
  const opts = parsed.base !== undefined ? { base: parsed.base } : {};
  return runSession(parsed.branch!, config, opts);
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: Error) => {
    process.stderr.write(`krowt: ${err.message}\n`);
    process.exitCode = 1;
  });
