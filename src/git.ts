import { execFile } from "node:child_process";

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
  for (const line of porcelain.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current?.path) {
        entries.push({ head: "", branch: null, detached: false, ...current } as WorktreeEntry);
      }
      current = { path: line.slice("worktree ".length) };
    } else if (current) {
      if (line.startsWith("HEAD ")) current.head = line.slice("HEAD ".length);
      else if (line.startsWith("branch ")) current.branch = line.slice("branch refs/heads/".length);
      else if (line === "detached") current.detached = true;
    }
  }
  if (current?.path) {
    entries.push({ head: "", branch: null, detached: false, ...current } as WorktreeEntry);
  }
  return entries;
}

export async function repoRoot(cwd: string): Promise<string> {
  return (await git(["rev-parse", "--show-toplevel"], cwd)).trim();
}

export async function worktreeList(repo: string): Promise<WorktreeEntry[]> {
  return parseWorktreeList(await git(["worktree", "list", "--porcelain"], repo));
}

export async function localBranchExists(repo: string, branch: string): Promise<boolean> {
  return gitOk(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], repo);
}

export async function localDefaultBranch(repo: string): Promise<string> {
  if (await localBranchExists(repo, "main")) return "main";
  if (await localBranchExists(repo, "master")) return "master";
  return "HEAD";
}
