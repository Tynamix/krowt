import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface LockInfo {
  pid: number;
  startedAt: string;
}

export class SessionLockedError extends Error {
  constructor(
    readonly branch: string,
    readonly info: LockInfo,
  ) {
    super(
      `a krowt session is already running for branch "${branch}" ` +
        `(PID ${info.pid}, started ${info.startedAt}). ` +
        `If that looks wrong, the stale lock can be removed from the worktree's git directory.`,
    );
    this.name = "SessionLockedError";
  }
}

export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === "EPERM";
  }
}

export function readLock(gitDir: string): LockInfo | null {
  const path = join(gitDir, "krowt.lock");
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<LockInfo>;
    if (typeof parsed.pid !== "number" || typeof parsed.startedAt !== "string") return null;
    return { pid: parsed.pid, startedAt: parsed.startedAt };
  } catch {
    return null;
  }
}

export function acquireLock(gitDir: string, branch: string): () => void {
  const path = join(gitDir, "krowt.lock");
  const existing = readLock(gitDir);
  if (existing && pidAlive(existing.pid) && existing.pid !== process.pid) {
    throw new SessionLockedError(branch, existing);
  }
  const info: LockInfo = { pid: process.pid, startedAt: new Date().toISOString() };
  writeFileSync(path, JSON.stringify(info));
  return () => rmSync(path, { force: true });
}
