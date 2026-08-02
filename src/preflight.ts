import { accessSync, constants } from "node:fs";
import { delimiter, isAbsolute, join } from "node:path";
import type { KrowtConfig } from "./config.js";

export interface PreflightResult {
  gitUiAvailable: boolean;
}

const INSTALL_HINTS: Record<string, string> = {
  opencode: "npm install -g opencode-ai",
  lazygit: "brew install lazygit",
};

export function installHint(command: string): string {
  return INSTALL_HINTS[command] ?? `install "${command}" and make sure it is on PATH`;
}

export function commandAvailable(command: string, env: NodeJS.ProcessEnv = process.env): boolean {
  if (command.includes("/")) {
    return isExecutable(command);
  }
  for (const dir of (env.PATH ?? "").split(delimiter)) {
    if (dir.length === 0) continue;
    if (isExecutable(join(dir, command))) return true;
  }
  return false;
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return isAbsolute(path);
  } catch {
    return false;
  }
}

export async function preflight(config: KrowtConfig): Promise<PreflightResult> {
  const agent = config.agent[0]!;
  if (!commandAvailable(agent)) {
    throw new Error(`agent command "${agent}" is not installed. Install it with: ${installHint(agent)}`);
  }
  const gitUi = config.gitUi[0]!;
  if (!commandAvailable(gitUi)) {
    process.stderr.write(
      `krowt: warning: git UI "${gitUi}" is not installed (${installHint(gitUi)}) — the commit/push step will be skipped\n`,
    );
    return { gitUiAvailable: false };
  }
  return { gitUiAvailable: true };
}
