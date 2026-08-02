import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { parse } from "smol-toml";

export interface KrowtConfig {
  agent: string[];
  gitUi: string[];
  worktreeDir: string;
}

export interface ConfigFlags {
  agent?: string;
  gitUi?: string;
  worktreeDir?: string;
}

const KNOWN_KEYS = new Set(["agent", "git_ui", "worktree_dir"]);

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
    if (!KNOWN_KEYS.has(key)) {
      throw new ConfigError(
        `invalid config file ${path}: unknown key "${key}" (known keys: ${[...KNOWN_KEYS].join(", ")})`,
      );
    }
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new ConfigError(`invalid config file ${path}: key "${key}" must be a non-empty string`);
    }
  }
  return parsed as FileConfig;
}

export function defaultWorktreeDir(repo: string): string {
  return join(dirname(repo), `${basename(repo)}-worktrees`);
}

function splitCommand(command: string): string[] {
  return command.split(/\s+/).filter((part) => part.length > 0);
}

function nonEmpty(value: string | undefined): string | undefined {
  return value !== undefined && value.trim().length > 0 ? value : undefined;
}

export function resolveConfig(
  repo: string,
  flags: ConfigFlags,
  env: NodeJS.ProcessEnv = process.env,
): KrowtConfig {
  const file = loadConfigFile(repo);
  const agent = nonEmpty(flags.agent) ?? nonEmpty(env.KROWT_AGENT) ?? file.agent ?? "opencode";
  const gitUi = nonEmpty(flags.gitUi) ?? nonEmpty(env.KROWT_GIT_UI) ?? file.git_ui ?? "lazygit";
  const worktreeDirRaw = nonEmpty(flags.worktreeDir) ?? file.worktree_dir ?? defaultWorktreeDir(repo);
  return {
    agent: splitCommand(agent),
    gitUi: splitCommand(gitUi),
    worktreeDir: isAbsolute(worktreeDirRaw) ? worktreeDirRaw : resolve(repo, worktreeDirRaw),
  };
}
