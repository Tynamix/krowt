import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { World } from "./helpers/world.js";

describe("branch resolution", () => {
  it("checks out an existing local branch into the worktree", async () => {
    const world = new World();
    world.git(["-C", world.repo, "branch", "feat/local"]);

    const result = await world.runKrowt(["feat/local"], { input: "n\n" });

    expect(result.code).toBe(0);
    const worktree = world.worktreePath("feat/local");
    expect(existsSync(worktree)).toBe(true);
    const checkedOut = world.git(["-C", worktree, "branch", "--show-current"]);
    expect(checkedOut).toBe("feat/local");
  });

  it("creates a local tracking branch when the branch exists only on the remote", async () => {
    const world = new World({ withRemote: true });
    world.git(["-C", world.repo, "push", "origin", "main:refs/heads/feat/remote"]);
    world.git(["-C", world.repo, "fetch", "origin"]);

    const result = await world.runKrowt(["feat/remote"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(existsSync(world.worktreePath("feat/remote"))).toBe(true);
    const upstream = world.git(["-C", world.repo, "rev-parse", "--abbrev-ref", "feat/remote@{u}"]);
    expect(upstream).toBe("origin/feat/remote");
  });

  it("fails with a clear error when the branch is checked out in another worktree", async () => {
    const world = new World();
    const other = join(world.root, "other-checkout");
    world.git(["-C", world.repo, "worktree", "add", other, "-b", "feat/taken"]);

    const result = await world.runKrowt(["feat/taken"], { input: "n\n" });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("feat/taken");
    expect(result.stderr).toContain("already checked out");
    expect(result.stderr).toContain(other);
    expect(existsSync(world.worktreePath("feat/taken"))).toBe(false);
  });

  it("fails with a clear error when the branch is checked out in the main working tree", async () => {
    const world = new World();

    const result = await world.runKrowt(["main"], { input: "n\n" });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("main");
    expect(result.stderr).toContain("already checked out");
  });

  it("resumes transparently into the existing worktree on re-run", async () => {
    const world = new World();
    const first = await world.runKrowt(["feat/login"], { input: "n\n" });
    expect(first.code).toBe(0);

    const second = await world.runKrowt(["feat/login"], { input: "n\n" });

    expect(second.code).toBe(0);
    const calls = world.stubCalls("opencode");
    expect(calls).toHaveLength(2);
    expect(calls[1]!.cwd).toBe(world.worktreePath("feat/login"));
    expect(existsSync(world.worktreePath("feat/login"))).toBe(true);
  });

  it("cleans up an orphaned directory unknown to git before recreating the worktree", async () => {
    const world = new World();
    const orphan = world.worktreePath("feat/x");
    mkdirSync(orphan, { recursive: true });
    writeFileSync(join(orphan, "leftover.txt"), "orphan\n");

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(existsSync(orphan)).toBe(true);
    expect(existsSync(join(orphan, "leftover.txt"))).toBe(false);
    const checkedOut = world.git(["-C", orphan, "branch", "--show-current"]);
    expect(checkedOut).toBe("feat/x");
  });
});
