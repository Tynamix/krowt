import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
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

describe("krowt list", () => {
  it("lists all krowt-managed worktrees with branch and path", async () => {
    const world = new World();
    await world.runKrowt(["feat/a"], { input: "n\n" });
    await world.runKrowt(["feat/b"], { input: "n\n" });

    const result = await world.runKrowt(["list"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("feat/a");
    expect(result.stdout).toContain(world.worktreePath("feat/a"));
    expect(result.stdout).toContain("feat/b");
    expect(result.stdout).toContain(world.worktreePath("feat/b"));
    expect(result.stdout).not.toContain(world.repo + " ");
  });

  it("marks a worktree with a live lock as running", async () => {
    const world = new World({ agent: { action: "block" } });
    const first = world.startKrowt(["feat/x"]);
    try {
      await waitFor(world.stubMarker);

      const result = await world.runKrowt(["list"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("feat/x");
      expect(result.stdout).toContain("running");
      expect(result.stdout).toContain(String(first.pid));
    } finally {
      process.kill(-first.pid!, "SIGKILL");
    }
  });

  it("marks a lock with a dead PID as stale", async () => {
    const world = new World();
    await world.runKrowt(["feat/x"], { input: "n\n" });
    const gitDir = world.worktreeGitDir(world.worktreePath("feat/x"));
    writeFileSync(
      join(gitDir, "krowt.lock"),
      JSON.stringify({ pid: await deadPid(), startedAt: new Date().toISOString() }),
    );

    const result = await world.runKrowt(["list"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("stale");
  });

  it("prints a friendly message when there are no sessions", async () => {
    const world = new World();

    const result = await world.runKrowt(["list"]);

    expect(result.code).toBe(0);
    expect(result.stdout.toLowerCase()).toContain("no active sessions");
  });

  it("fails clearly outside a git repository", async () => {
    const world = new World();

    const result = await world.runKrowt(["list"], { cwd: world.root });

    expect(result.code).toBe(1);
    expect(result.stderr.toLowerCase()).toContain("not inside a git repository");
  });
});
