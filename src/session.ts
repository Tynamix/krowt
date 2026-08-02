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
  worktreeGitDir,
  worktreeList,
} from "./git.js";
import { acquireLock } from "./lock.js";
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

  const releaseLock = acquireLock(await worktreeGitDir(worktreePath), branch);
  try {
    return await runSessionInWorktree(repo, branch, worktreePath);
  } finally {
    releaseLock();
  }
}

async function runSessionInWorktree(repo: string, branch: string, worktreePath: string): Promise<number> {
  const env = { ...process.env, KROWT_BRANCH: branch, KROWT_WORKTREE: worktreePath };
  const agent = ["opencode"];
  const startHead = (await git(["rev-parse", "HEAD"], worktreePath)).trim();
  for (;;) {
    const result = await runForeground(agent, { cwd: worktreePath, env });
    if (result.code === 0) break;
    const what = result.signal
      ? `Agent was killed by ${result.signal}.`
      : `Agent exited with code ${result.code ?? "?"}.`;
    const restart = await confirm(`${what} Restart the agent?`, true);
    if (!restart) break;
  }

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

  const after = await checkForUnsecuredWork(worktreePath);
  const endHead = (await git(["rev-parse", "HEAD"], worktreePath)).trim();
  const secure = after.dirtyFiles === 0 && after.unpushedCommits === 0;
  const reason = describeState(after, endHead === startHead);
  const del = await confirm(`Delete worktree ${worktreePath}? (${reason})`, secure);
  if (del) {
    try {
      const args = ["worktree", "remove"];
      if (!secure) args.push("--force");
      args.push(worktreePath);
      await git(args, repo);
      process.stderr.write(`Removed worktree ${worktreePath}\n`);
    } catch (err) {
      process.stderr.write(`krowt: could not remove worktree: ${(err as Error).message}\n`);
    }
  }
  return 0;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${pluralForm}`;
}

export function describeState(
  changes: { dirtyFiles: number; unpushedCommits: number },
  headUnchanged: boolean,
): string {
  const parts: string[] = [];
  if (changes.dirtyFiles > 0) parts.push(plural(changes.dirtyFiles, "uncommitted file", "uncommitted files"));
  if (changes.unpushedCommits > 0) parts.push(plural(changes.unpushedCommits, "unpushed commit", "unpushed commits"));
  if (parts.length > 0) return parts.join(", ");
  return headUnchanged ? "nothing changed" : "all work committed and pushed";
}
