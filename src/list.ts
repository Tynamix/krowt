import { dirname } from "node:path";
import type { KrowtConfig } from "./config.js";
import { worktreeGitDir, worktreeList } from "./git.js";
import { pidAlive, readLock } from "./lock.js";

export async function runList(repo: string, config: KrowtConfig): Promise<number> {
  const entries = await worktreeList(repo);
  const managed = entries.filter((e) => dirname(e.path) === config.worktreeDir);

  if (managed.length === 0) {
    process.stdout.write("No active sessions.\n");
    return 0;
  }

  const rows: Array<{ branch: string; path: string; status: string }> = [];
  for (const entry of managed) {
    let status = "no lock";
    const lock = readLock(await worktreeGitDir(entry.path));
    if (lock) {
      status = pidAlive(lock.pid)
        ? `running (PID ${lock.pid}, started ${lock.startedAt})`
        : `stale lock (PID ${lock.pid})`;
    }
    rows.push({ branch: entry.branch ?? "(detached)", path: entry.path, status });
  }

  const width = Math.max(...rows.map((r) => r.branch.length));
  for (const row of rows) {
    const line = `${row.branch.padEnd(width)}  ${row.path}${row.status ? `  ${row.status}` : ""}`;
    process.stdout.write(`${line}\n`);
  }
  return 0;
}
