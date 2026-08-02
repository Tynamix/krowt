import type { KrowtConfig } from "./config.js";
import { checkForUnsecuredWork, git, worktreeGitDir, type ChangeCheck } from "./git.js";
import { acquireLock } from "./lock.js";
import { preflight } from "./preflight.js";
import { confirm } from "./prompt.js";
import { CommandNotFoundError, runForeground } from "./runner.js";
import { ensureWorktree } from "./worktree.js";

export interface SessionOptions {
  base?: string;
}

export async function runSession(
  repo: string,
  branch: string,
  config: KrowtConfig,
  opts: SessionOptions = {},
): Promise<number> {
  const { gitUiAvailable } = await preflight(config);
  const worktreePath = await ensureWorktree(repo, branch, config, opts);

  const releaseLock = acquireLock(await worktreeGitDir(worktreePath), branch);
  try {
    return await runSessionInWorktree(repo, branch, worktreePath, config, gitUiAvailable);
  } finally {
    releaseLock();
  }
}

async function runSessionInWorktree(
  repo: string,
  branch: string,
  worktreePath: string,
  config: KrowtConfig,
  gitUiAvailable: boolean,
): Promise<number> {
  const env = { ...process.env, KROWT_BRANCH: branch, KROWT_WORKTREE: worktreePath };
  const agent = config.agent;
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
  if (gitUiAvailable && (changes.dirtyFiles > 0 || changes.unpushedCommits > 0)) {
    const gitUi = config.gitUi;
    try {
      await runForeground(gitUi, { cwd: worktreePath, env });
    } catch (err) {
      if (err instanceof CommandNotFoundError) {
        process.stderr.write(
          `krowt: warning: git UI "${gitUi.bin}" is not installed — skipping the commit/push step\n`,
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
  const shouldDelete = await confirm(`Delete worktree ${worktreePath}? (${reason})`, secure);
  if (shouldDelete) {
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

export function describeState(changes: ChangeCheck, headUnchanged: boolean): string {
  const parts: string[] = [];
  if (changes.dirtyFiles > 0) parts.push(plural(changes.dirtyFiles, "uncommitted file", "uncommitted files"));
  if (changes.unpushedCommits > 0) parts.push(plural(changes.unpushedCommits, "unpushed commit", "unpushed commits"));
  if (parts.length > 0) return parts.join(", ");
  return headUnchanged ? "nothing changed" : "all work committed and pushed";
}
