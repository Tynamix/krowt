import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { World } from "./helpers/world.js";

describe("delete prompt", () => {
  it("defaults to yes when nothing changed", async () => {
    const world = new World();

    const result = await world.runKrowt(["feat/x"], { input: "\n" });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("nothing changed");
    expect(result.stderr).toContain("[Y/n]");
    expect(existsSync(world.worktreePath("feat/x"))).toBe(false);
  });

  it("defaults to yes when all work is committed and pushed", async () => {
    const world = new World({ withRemote: true, agent: { action: "push" } });

    const result = await world.runKrowt(["feat/x"], { input: "\n" });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("all work committed and pushed");
    expect(result.stderr).toContain("[Y/n]");
    expect(existsSync(world.worktreePath("feat/x"))).toBe(false);
    const branches = world.git(["-C", world.repo, "branch", "--list", "feat/x"]);
    expect(branches).toContain("feat/x");
  });

  it("defaults to no with uncommitted changes and states the count", async () => {
    const world = new World({ agent: { action: "write" } });

    const result = await world.runKrowt(["feat/x"], { input: "\n" });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("1 uncommitted file");
    expect(result.stderr).toContain("[y/N]");
    expect(existsSync(world.worktreePath("feat/x"))).toBe(true);
  });

  it("defaults to no with unpushed commits", async () => {
    const world = new World({ withRemote: true, agent: { action: "commit" } });

    const result = await world.runKrowt(["feat/x"], { input: "\n" });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("1 unpushed commit");
    expect(result.stderr).toContain("[y/N]");
    expect(existsSync(world.worktreePath("feat/x"))).toBe(true);
  });

  it("combines uncommitted files and unpushed commits in the reason", async () => {
    const world = new World({ withRemote: true, agent: { action: "commitwrite" } });

    const result = await world.runKrowt(["feat/x"], { input: "\n" });

    expect(result.code).toBe(0);
    expect(result.stderr).toMatch(/1 uncommitted file.*1 unpushed commit/);
    expect(existsSync(world.worktreePath("feat/x"))).toBe(true);
  });

  it("force-removes the worktree when yes is answered despite unsecured work, keeping the branch", async () => {
    const world = new World({ agent: { action: "write" } });

    const result = await world.runKrowt(["feat/x"], { input: "y\n" });

    expect(result.code).toBe(0);
    expect(existsSync(world.worktreePath("feat/x"))).toBe(false);
    const branches = world.git(["-C", world.repo, "branch", "--list", "feat/x"]);
    expect(branches).toContain("feat/x");
  });
});
