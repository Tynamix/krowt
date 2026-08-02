import { describe, expect, it } from "vitest";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { World } from "./helpers/world.js";

async function waitFor(path: string, timeoutMs = 10_000): Promise<void> {
  const start = Date.now();
  while (!existsSync(path)) {
    if (Date.now() - start > timeoutMs) throw new Error(`timed out waiting for ${path}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

function deadPid(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["-e", ""]);
    child.on("close", () => resolve(child.pid!));
  });
}

describe("session lock", () => {
  it("aborts hard when a live session holds the lock, naming PID and start time", async () => {
    const world = new World({ agent: { action: "block" } });
    const first = world.startKrowt(["feat/x"]);
    try {
      await waitFor(world.stubMarker);

      const second = await world.runKrowt(["feat/x"], { input: "n\n" });

      expect(second.code).toBe(1);
      expect(second.stderr).toContain("already running");
      expect(second.stderr).toContain(String(first.pid));
      expect(second.stderr).toMatch(/started .*20\d\d/i);
      // no mutation: the agent was not started a second time
      expect(world.stubCalls("opencode")).toHaveLength(1);
    } finally {
      process.kill(-first.pid!, "SIGKILL");
    }
  });

  it("takes over a stale lock (dead PID) silently", async () => {
    const world = new World();
    const first = await world.runKrowt(["feat/x"], { input: "n\n" });
    expect(first.code).toBe(0);
    const gitDir = world.worktreeGitDir(world.worktreePath("feat/x"));
    const pid = await deadPid();
    writeFileSync(
      join(gitDir, "krowt.lock"),
      JSON.stringify({ pid, startedAt: new Date().toISOString() }),
    );

    const second = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(second.code).toBe(0);
    expect(second.stderr).not.toContain("already running");
    expect(world.stubCalls("opencode")).toHaveLength(2);
  });

  it("removes the lock on clean exit", async () => {
    const world = new World();
    const result = await world.runKrowt(["feat/x"], { input: "n\n" });
    expect(result.code).toBe(0);
    const gitDir = world.worktreeGitDir(world.worktreePath("feat/x"));
    expect(existsSync(join(gitDir, "krowt.lock"))).toBe(false);
  });

  it("never leaves the lock file visible to git status", async () => {
    const world = new World({ agent: { action: "block" } });
    const first = world.startKrowt(["feat/x"]);
    try {
      await waitFor(world.stubMarker);
      const worktree = world.worktreePath("feat/x");
      const gitDir = world.worktreeGitDir(worktree);
      expect(existsSync(join(gitDir, "krowt.lock"))).toBe(true);
      const status = world.git(["-C", worktree, "status", "--porcelain"]);
      expect(status).toBe("");
    } finally {
      process.kill(-first.pid!, "SIGKILL");
    }
  });
});
