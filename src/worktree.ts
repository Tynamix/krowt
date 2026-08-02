import { mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import type { KrowtConfig } from "./config.js";
import {
  fetchBestEffort,
  git,
  localBranchExists,
  localDefaultBranch,
  lsRemoteHead,
  remoteBranchExists,
  remoteHeadSymref,
  worktreeList,
} from "./git.js";

export function sanitizeBranch(branch: string): string {
  return branch.replaceAll("/", "-");
}

export async function resolveBase(repo: string, flagBase?: string): Promise<string> {
  if (flagBase) return flagBase;
  const fetched = await fetchBestEffort(repo);
  if (!fetched) {
    const local = await localDefaultBranch(repo);
    process.stderr.write(
      `krowt: warning: could not fetch the remote default branch (offline or no remote) — branching from local "${local}"\n`,
    );
    return local;
  }
  const symref = await remoteHeadSymref(repo);
  if (symref) return symref;
  const lsRemote = await lsRemoteHead(repo);
  if (lsRemote) return lsRemote;
  const local = await localDefaultBranch(repo);
  process.stderr.write(
    `krowt: warning: could not determine the remote default branch — branching from local "${local}"\n`,
  );
  return local;
}

export async function ensureWorktree(
  repo: string,
  branch: string,
  config: KrowtConfig,
  opts: { base?: string } = {},
): Promise<string> {
  let worktreePath = join(config.worktreeDir, sanitizeBranch(branch));

  const existing = (await worktreeList(repo)).find((w) => w.branch === branch);
  if (existing && existing.path === worktreePath) {
    worktreePath = existing.path;
    process.stderr.write(`Resuming session in ${worktreePath}\n`);
    return worktreePath;
  }
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
  return worktreePath;
}
