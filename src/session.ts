import { mkdirSync, existsSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  checkForUnsecuredWork,
  fetchBestEffort,
  git,
  localBranchExists,
  localDefaultBranch,
  lsRemoteHead,
  remoteBranchExists,
  remoteHeadSymref,
  repoRoot,
  worktreeList,
} from "./git.js";
import { confirm } from "./prompt.js";
import { CommandNotFoundError, runForeground } from "./runner.js";

export function sanitizeBranch(branch: string): string {
  return branch.replaceAll("/", "-");
}

export interface SessionOptions {
  base?: string;
}

export async function resolveBase(repo: string, flagBase?: string): Promise<string> {
  if (flagBase) return flagBase;
  await fetchBestEffort(repo);
  const symref = await remoteHeadSymref(repo);
  if (symref) return symref;
  const lsRemote = await lsRemoteHead(repo);
  if (lsRemote) return lsRemote;
  const local = await localDefaultBranch(repo);
  process.stderr.write(
    `krowt: warning: could not determine the remote default branch (offline or no remote) — branching from local "${local}"\n`,
  );
  return local;
}

export async function runSession(branch: string, opts: SessionOptions = {}): Promise<number> {
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
      const base = await resolveBase(repo, opts.base);
      await git(["worktree", "add", "-b", branch, worktreePath, base], repo);
    }
    process.stderr.write(`Created worktree ${worktreePath}\n`);
  }

  const env = { ...process.env, KROWT_BRANCH: branch, KROWT_WORKTREE: worktreePath };
  const agent = ["opencode"];
  await runForeground(agent, { cwd: worktreePath, env });

  const changes = await checkForUnsecuredWork(worktreePath);
  if (changes.dirtyFiles > 0 || changes.unpushedCommits > 0) {
    const gitUi = ["lazygit"];
    try {
      await runForeground(gitUi, { cwd: worktreePath, env });
    } catch (err) {
      if (err instanceof CommandNotFoundError) {
        process.stderr.write(
          `krowt: warning: git UI "${gitUi[0]}" is not installed — skipping the commit/push step\n`,
        );
      } else {
        throw err;
      }
    }
  }

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
