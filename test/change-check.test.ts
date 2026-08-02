import { describe, expect, it } from "vitest";
import { World } from "./helpers/world.js";

describe("change check + git UI", () => {
  it("opens the git UI in the worktree when the agent leaves uncommitted changes", async () => {
    const world = new World({ agent: { action: "write" } });

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    const calls = world.stubCalls("lazygit");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.cwd).toBe(world.worktreePath("feat/x"));
  });

  it("opens the git UI when the agent committed but nothing is pushed (no upstream)", async () => {
    const world = new World({ withRemote: true, agent: { action: "commit" } });

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(world.stubCalls("lazygit")).toHaveLength(1);
  });

  it("opens the git UI when there are unpushed commits despite an upstream", async () => {
    const world = new World({ withRemote: true, agent: { action: "push" } });
    // first session: agent commits and pushes (sets upstream), keep worktree
    const first = await world.runKrowt(["feat/x"], { input: "n\n" });
    expect(first.code).toBe(0);
    expect(world.stubCalls("lazygit")).toHaveLength(0);

    // second session: agent commits again -> ahead of upstream
    world.writeStub("opencode", { action: "commit" });
    const second = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(second.code).toBe(0);
    expect(world.stubCalls("lazygit")).toHaveLength(1);
  });

  it("skips the git UI when the tree is clean and everything is pushed", async () => {
    const world = new World({ withRemote: true, agent: { action: "push" } });

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(world.stubCalls("lazygit")).toHaveLength(0);
  });

  it("skips the git UI for a read-only session on a fresh branch without upstream", async () => {
    const world = new World({ withRemote: true });

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(world.stubCalls("lazygit")).toHaveLength(0);
  });

  it("warns and continues when the git UI is not installed", async () => {
    const world = new World({ gitUi: false, agent: { action: "write" } });

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(result.stderr.toLowerCase()).toContain("warning");
    expect(result.stderr).toContain("lazygit");
    expect(existsSyncWorktree(world, "feat/x")).toBe(true);
  });
});

function existsSyncWorktree(world: World, branch: string): boolean {
  try {
    world.git(["-C", world.worktreePath(branch), "status"]);
    return true;
  } catch {
    return false;
  }
}
