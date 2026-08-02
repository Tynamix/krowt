import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { World } from "./helpers/world.js";

describe("krowt <branch> happy path", () => {
  it("creates a worktree at the sanitized path and runs the agent inside it with KROWT env vars", async () => {
    const world = new World();

    const result = await world.runKrowt(["feat/login"], { input: "n\n" });

    expect(result.code).toBe(0);
    const worktree = world.worktreePath("feat/login");
    expect(existsSync(worktree)).toBe(true);

    const calls = world.stubCalls("opencode");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.cwd).toBe(worktree);
    expect(calls[0]!.branch).toBe("feat/login");
    expect(calls[0]!.worktree).toBe(worktree);

    const branches = world.git(["-C", world.repo, "branch", "--list", "feat/login"]);
    expect(branches).toContain("feat/login");
  });

  it("removes the worktree when the delete prompt is answered with yes, keeping the branch", async () => {
    const world = new World();

    const result = await world.runKrowt(["feat/login"], { input: "y\n" });

    expect(result.code).toBe(0);
    expect(existsSync(world.worktreePath("feat/login"))).toBe(false);
    const worktrees = world.git(["-C", world.repo, "worktree", "list", "--porcelain"]);
    expect(worktrees).not.toContain("feat-login");
    const branches = world.git(["-C", world.repo, "branch", "--list", "feat/login"]);
    expect(branches).toContain("feat/login");
  });

  it("keeps worktree and branch when the delete prompt is answered with no", async () => {
    const world = new World();

    const result = await world.runKrowt(["feat/login"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(existsSync(world.worktreePath("feat/login"))).toBe(true);
    const branches = world.git(["-C", world.repo, "branch", "--list", "feat/login"]);
    expect(branches).toContain("feat/login");
  });
});
