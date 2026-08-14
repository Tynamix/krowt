import { execFile } from "node:child_process";
import { isAbsolute, resolve } from "node:path";

export class GitError extends Error {
  constructor(
    message: string,
    readonly stderr: string,
  ) {
    super(message);
    this.name = "GitError";
  }
}

export function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      {
        cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new GitError(`git ${args.join(" ")} failed: ${stderr.trim() || error.message}`, stderr));
          return;
        }
        resolve(stdout);
      },
    );
  });
}

export async function gitOk(args: string[], cwd: string): Promise<boolean> {
  try {
    await git(args, cwd);
    return true;
  } catch {
    return false;
  }
}

export interface WorktreeEntry {
  path: string;
  head: string;
  branch: string | null;
  detached: boolean;
}

export function parseWorktreeList(porcelain: string): WorktreeEntry[] {
  const entries: WorktreeEntry[] = [];
  let current: Partial<WorktreeEntry> | null = null;
  const flush = () => {
    if (current?.path) {
      entries.push({ head: "", branch: null, detached: false, ...current } as WorktreeEntry);
    }
  };
  for (const line of porcelain.split("\n")) {
    if (line.startsWith("worktree ")) {
      flush();
      current = { path: line.slice("worktree ".length) };
    } else if (current) {
      if (line.startsWith("HEAD ")) current.head = line.slice("HEAD ".length);
      else if (line.startsWith("branch ")) current.branch = line.slice("branch refs/heads/".length);
      else if (line === "detached") current.detached = true;
    }
  }
  flush();
  return entries;
}

export async function repoRoot(cwd: string): Promise<string> {
  return (await git(["rev-parse", "--show-toplevel"], cwd)).trim();
}

export class NotARepositoryError extends Error {
  constructor() {
    super("not inside a git repository — krowt must be run from within a git repository");
    this.name = "NotARepositoryError";
  }
}

export async function requireRepo(cwd: string): Promise<string> {
  try {
    return await repoRoot(cwd);
  } catch (err) {
    if (err instanceof GitError) throw new NotARepositoryError();
    throw err;
  }
}

export async function worktreeGitDir(worktree: string): Promise<string> {
  const out = (await git(["rev-parse", "--git-dir"], worktree)).trim();
  return isAbsolute(out) ? out : resolve(worktree, out);
}

export async function worktreeList(repo: string): Promise<WorktreeEntry[]> {
  return parseWorktreeList(await git(["worktree", "list", "--porcelain"], repo));
}

export async function localBranchExists(repo: string, branch: string): Promise<boolean> {
  return gitOk(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], repo);
}

export async function remoteBranchExists(repo: string, remote: string, branch: string): Promise<boolean> {
  return gitOk(["show-ref", "--verify", "--quiet", `refs/remotes/${remote}/${branch}`], repo);
}

export async function localDefaultBranch(repo: string): Promise<string> {
  if (await localBranchExists(repo, "main")) return "main";
  if (await localBranchExists(repo, "master")) return "master";
  return "HEAD";
}

export async function defaultRemote(repo: string): Promise<string | null> {
  const local = await localDefaultBranch(repo);
  if (local !== "HEAD") {
    const upstream = await gitOrNull(["config", `branch.${local}.remote`], repo);
    if (upstream && upstream !== ".") return upstream;
  }
  const remotes = (await git(["remote"], repo))
    .trim()
    .split("\n")
    .filter((r) => r.length > 0);
  if (remotes.includes("origin")) return "origin";
  return remotes[0] ?? null;
}

export async function fetchBestEffort(repo: string, remote: string): Promise<boolean> {
  return gitOk(["fetch", remote], repo);
}

async function gitOrNull(args: string[], cwd: string): Promise<string | null> {
  try {
    const out = (await git(args, cwd)).trim();
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export async function remoteHeadSymref(repo: string, remote: string): Promise<string | null> {
  return gitOrNull(["symbolic-ref", "--short", `refs/remotes/${remote}/HEAD`], repo);
}

export async function lsRemoteHead(repo: string, remote: string): Promise<string | null> {
  const out = await gitOrNull(["ls-remote", "--symref", remote, "HEAD"], repo);
  if (!out) return null;
  const match = out.match(/^ref: refs\/heads\/(\S+)\tHEAD/m);
  return match?.[1] ? `${remote}/${match[1]}` : null;
}

export interface ChangeCheck {
  dirtyFiles: number;
  unpushedCommits: number;
}

export async function checkForUnsecuredWork(worktree: string): Promise<ChangeCheck> {
  const status = await git(["status", "--porcelain"], worktree);
  const dirtyFiles = status.split("\n").filter((line) => line.length > 0).length;

  const upstream = await upstreamName(worktree);
  let unpushedCommits: number;
  if (upstream) {
    unpushedCommits = await countRevs(worktree, ["@{u}..HEAD"]);
  } else if (await hasAnyRemote(worktree)) {
    unpushedCommits = await countRevs(worktree, ["HEAD", "--not", "--remotes"]);
  } else {
    const localDefault = await localDefaultBranch(worktree);
    unpushedCommits = localDefault === "HEAD" ? 0 : await countRevs(worktree, ["HEAD", "--not", localDefault]);
  }
  return { dirtyFiles, unpushedCommits };
}

async function upstreamName(worktree: string): Promise<string | null> {
  return gitOrNull(["rev-parse", "--abbrev-ref", "@{u}"], worktree);
}

async function hasAnyRemote(worktree: string): Promise<boolean> {
  return (await git(["remote"], worktree)).trim().length > 0;
}

async function countRevs(worktree: string, args: string[]): Promise<number> {
  const out = (await git(["rev-list", "--count", ...args], worktree)).trim();
  return Number.parseInt(out, 10) || 0;
}
