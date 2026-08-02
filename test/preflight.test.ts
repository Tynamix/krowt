import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { World } from "./helpers/world.js";

describe("preflight + repo discovery", () => {
  it("runs from any subdirectory, resolving all paths from the repo root", async () => {
    const world = new World();
    const nested = join(world.repo, "deep", "nested");
    mkdirSync(nested, { recursive: true });

    const result = await world.runKrowt(["feat/x"], { input: "n\n", cwd: nested });

    expect(result.code).toBe(0);
    const worktree = world.worktreePath("feat/x");
    expect(existsSync(worktree)).toBe(true);
    expect(world.stubCalls("opencode")[0]!.cwd).toBe(worktree);
  });

  it("fails clearly outside a git repository", async () => {
    const world = new World();

    const result = await world.runKrowt(["feat/x"], { input: "n\n", cwd: world.root });

    expect(result.code).toBe(1);
    expect(result.stderr.toLowerCase()).toContain("not inside a git repository");
  });

  it("aborts before any mutation when the agent is not installed, with the install hint", async () => {
    const world = new World();

    const result = await world.runKrowt(["feat/x"], {
      input: "n\n",
      env: { KROWT_AGENT: "definitely-missing-agent" },
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("definitely-missing-agent");
    expect(result.stderr.toLowerCase()).toContain("install");
    expect(existsSync(world.worktreePath("feat/x"))).toBe(false);
    expect(world.git(["-C", world.repo, "branch", "--list", "feat/x"])).toBe("");
  });

  it("names the exact install command for known tools", async () => {
    const world = new World();
    world.removeStub("opencode");

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("npm install -g opencode-ai");
    expect(existsSync(world.worktreePath("feat/x"))).toBe(false);
  });

  it("warns once at the start when the git UI is missing and skips that step later", async () => {
    const world = new World({ gitUi: false, agent: { action: "write" } });

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    const warnings = result.stderr.match(/git UI "lazygit" is not installed/g) ?? [];
    expect(warnings).toHaveLength(1);
    expect(result.stderr).toContain("commit/push");
    expect(world.stubCalls("opencode")).toHaveLength(1);
  });

  it("checks the configured agent command, not a hardcoded one", async () => {
    const world = new World();
    mkdirSync(join(world.repo, ".krowt"), { recursive: true });
    const { writeFileSync } = await import("node:fs");
    writeFileSync(join(world.repo, ".krowt", "config.toml"), 'agent = "not-on-path-agent"\n');

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("not-on-path-agent");
    expect(existsSync(world.worktreePath("feat/x"))).toBe(false);
  });
});
