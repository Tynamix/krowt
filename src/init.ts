import { execFile } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { configPath, type KrowtConfig } from "./config.js";
import { installHint, whichPath } from "./preflight.js";

const TEMPLATE = `# krowt configuration — team policy for this repository.
# Precedence: CLI flag > environment variable > this file > built-in defaults.

# The AI coding agent command krowt runs inside the session worktree.
# CLI flag: --agent · environment: KROWT_AGENT · default: "opencode"
# agent = "opencode"

# The git UI krowt opens when work needs committing or pushing after a session.
# CLI flag: --git-ui · environment: KROWT_GIT_UI · default: "lazygit"
# git_ui = "lazygit"

# Where session worktrees live. Relative paths resolve against the
# repository root; absolute paths are used as-is.
# CLI flag: --worktree-dir · environment: KROWT_WORKTREE_DIR · default:
# sibling directory "<repo>-worktrees"
# worktree_dir = "../myrepo-worktrees"
`;

function toolVersion(command: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(command, ["--version"], { timeout: 5_000 }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      const firstLine = stdout.split("\n")[0]?.trim();
      resolve(firstLine ? firstLine : null);
    });
  });
}

export async function runInit(repo: string, config: KrowtConfig): Promise<number> {
  const path = configPath(repo);
  if (existsSync(path)) {
    process.stdout.write(`${path} already exists — leaving it untouched.\n`);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, TEMPLATE);
    process.stdout.write(`Created ${path}\n`);
  }

  process.stdout.write("\nTool check:\n");
  const tools: Array<[string, string]> = [
    ["agent", config.agent.bin],
    ["git UI", config.gitUi.bin],
  ];
  for (const [label, command] of tools) {
    const found = whichPath(command);
    if (found) {
      const version = await toolVersion(command);
      process.stdout.write(`  ✓ ${label} "${command}" — ${version ?? found}\n`);
    } else {
      process.stdout.write(`  ✗ ${label} "${command}" — not installed. Install it with: ${installHint(command)}\n`);
    }
  }
  return 0;
}
