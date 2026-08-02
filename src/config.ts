import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { parse } from "smol-toml";

export interface Command {
  bin: string;
  args: string[];
}

export interface KrowtConfig {
  agent: Command;
  gitUi: Command;
  worktreeDir: string;
  splash: boolean;
}

export interface ConfigFlags {
  agent?: string;
  gitUi?: string;
  worktreeDir?: string;
}

const STRING_KEYS = new Set(["agent", "git_ui", "worktree_dir"]);
const BOOLEAN_KEYS = new Set(["splash"]);

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

interface FileConfig {
  agent?: string;
  git_ui?: string;
  worktree_dir?: string;
  splash?: boolean;
}

export function configPath(repo: string): string {
  return join(repo, ".krowt", "config.toml");
}

function loadConfigFile(repo: string): FileConfig {
  const path = configPath(repo);
  if (!existsSync(path)) return {};
  let parsed: Record<string, unknown>;
  try {
    parsed = parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch (err) {
    throw new ConfigError(`invalid config file ${path}: ${(err as Error).message}`);
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (STRING_KEYS.has(key)) {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new ConfigError(`invalid config file ${path}: key "${key}" must be a non-empty string`);
      }
    } else if (BOOLEAN_KEYS.has(key)) {
      if (typeof value !== "boolean") {
        throw new ConfigError(`invalid config file ${path}: key "${key}" must be a boolean`);
      }
    } else {
      throw new ConfigError(
        `invalid config file ${path}: unknown key "${key}" (known keys: ${[...STRING_KEYS, ...BOOLEAN_KEYS].join(", ")})`,
      );
    }
  }
  return parsed as FileConfig;
}

export function defaultWorktreeDir(repo: string): string {
  return join(dirname(repo), `${basename(repo)}-worktrees`);
}

function splitCommand(command: string): Command {
  const parts = command.split(/\s+/).filter((part) => part.length > 0);
  return { bin: parts[0]!, args: parts.slice(1) };
}

function nonEmpty(value: string | undefined): string | undefined {
  return value !== undefined && value.trim().length > 0 ? value : undefined;
}

function envBoolean(value: string | undefined): boolean | undefined {
  const raw = nonEmpty(value);
  if (raw === undefined) return undefined;
  return !(raw === "false" || raw === "0");
}

export function resolveConfig(
  repo: string,
  flags: ConfigFlags,
  env: NodeJS.ProcessEnv = process.env,
): KrowtConfig {
  const file = loadConfigFile(repo);
  const agent = nonEmpty(flags.agent) ?? nonEmpty(env.KROWT_AGENT) ?? file.agent ?? "opencode";
  const gitUi = nonEmpty(flags.gitUi) ?? nonEmpty(env.KROWT_GIT_UI) ?? file.git_ui ?? "lazygit";
  const worktreeDirRaw =
    nonEmpty(flags.worktreeDir) ?? nonEmpty(env.KROWT_WORKTREE_DIR) ?? file.worktree_dir ?? defaultWorktreeDir(repo);
  return {
    agent: splitCommand(agent),
    gitUi: splitCommand(gitUi),
    worktreeDir: isAbsolute(worktreeDirRaw) ? worktreeDirRaw : resolve(repo, worktreeDirRaw),
    splash: envBoolean(env.KROWT_SPLASH) ?? file.splash ?? true,
  };
}
