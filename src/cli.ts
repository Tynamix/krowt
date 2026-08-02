#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolveConfig, type ConfigFlags } from "./config.js";
import { requireRepo } from "./git.js";
import { HELP_TEXT } from "./help.js";
import { runInit } from "./init.js";
import { runList } from "./list.js";
import { runSession } from "./session.js";

export interface ParsedArgs extends ConfigFlags {
  command: "session" | "init" | "list" | "help" | "version";
  branch?: string;
  base?: string;
  explicitHelp?: boolean;
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
      return { command: "help", explicitHelp: true };
    } else if (arg === "--version") {
      return { command: "version" };
    } else if (arg.startsWith("-")) {
      throw new Error(`unknown flag: ${arg}`);
    } else if (branch === undefined) {
      branch = arg;
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  if (branch !== undefined) {
    if (branch === "init" || branch === "list") {
      parsed.command = branch;
    } else {
      parsed.command = "session";
      parsed.branch = branch;
    }
  }
  return parsed;
}

function version(): string {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  };
  return pkg.version;
}

async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if (parsed.command === "version") {
    process.stdout.write(`${version()}\n`);
    return 0;
  }
  if (parsed.command === "help") {
    if (parsed.explicitHelp) {
      process.stdout.write(HELP_TEXT);
      return 0;
    }
    process.stderr.write(HELP_TEXT);
    return 1;
  }
  const repo = await requireRepo(process.cwd());
  const config = resolveConfig(repo, parsed);
  if (parsed.command === "init") {
    return runInit(repo, config);
  }
  if (parsed.command === "list") {
    return runList(repo, config);
  }
  const opts = parsed.base !== undefined ? { base: parsed.base } : {};
  return runSession(repo, parsed.branch!, config, opts);
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: Error) => {
    process.stderr.write(`krowt: ${err.message}\n`);
    process.exitCode = 1;
  });
