import { mkdirSync, existsSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  git,
  localBranchExists,
  localDefaultBranch,
  remoteBranchExists,
  repoRoot,
  worktreeList,
} from "./git.js";
import { confirm } from "./prompt.js";
import { runForeground } from "./runner.js";

export function sanitizeBranch(branch: string): string {
  return branch.replaceAll("/", "-");
}

export async function runSession(branch: string): Promise<number> {
  const repo = await repoRoot(process.cwd());
  const worktreesDir = join(dirname(repo), `${basename(repo)}-worktrees`);
  let worktreePath = join(worktreesDir, sanitizeBranch(branch));

  const existing = (await worktreeList(repo)).find((w) => w.branch === branch);
  if (existing && existing.path === worktreePath) {
    worktreePath = existing.path;
    process.stderr.write(`Resuming session in ${worktreePath}\n`);
  } else {
    if (existing) {
      throw new Error(
        `branch "${branch}" is already checked out at ${existing.path} — finish that session or remove the worktree first`,
      );
    }
    if (existsSync(worktreePath)) {
      rmSync(worktreePath, { recursive: true, force: true });
    }
    mkdirSync(dirname(worktreePath), { recursive: true });
    if (await localBranchExists(repo, branch)) {
      await git(["worktree", "add", worktreePath, branch], repo);
    } else if (await remoteBranchExists(repo, branch)) {
      await git(["worktree", "add", "--track", "-b", branch, worktreePath, `origin/${branch}`], repo);
    } else {
      const base = await localDefaultBranch(repo);
      await git(["worktree", "add", "-b", branch, worktreePath, base], repo);
    }
    process.stderr.write(`Created worktree ${worktreePath}\n`);
  }

  const env = { ...process.env, KROWT_BRANCH: branch, KROWT_WORKTREE: worktreePath };
  const agent = ["opencode"];
  await runForeground(agent, { cwd: worktreePath, env });

  const del = await confirm(`Delete worktree ${worktreePath}?`, false);
  if (del) {
    try {
      await git(["worktree", "remove", worktreePath], repo);
      process.stderr.write(`Removed worktree ${worktreePath}\n`);
    } catch (err) {
      process.stderr.write(`krowt: could not remove worktree: ${(err as Error).message}\n`);
    }
  }
  return 0;
}
