import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { World } from "./helpers/world.js";

function writeConfig(world: World, content: string): void {
  mkdirSync(join(world.repo, ".krowt"), { recursive: true });
  writeFileSync(join(world.repo, ".krowt", "config.toml"), content);
}

describe("config system", () => {
  it("uses the agent command from the config file", async () => {
    const world = new World();
    world.writeStub("myagent");
    writeConfig(world, 'agent = "myagent"\n');

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(world.stubCalls("myagent")).toHaveLength(1);
    expect(world.stubCalls("opencode")).toHaveLength(0);
  });

  it("prefers KROWT_AGENT over the config file", async () => {
    const world = new World();
    world.writeStub("myagent");
    world.writeStub("envagent");
    writeConfig(world, 'agent = "myagent"\n');

    const result = await world.runKrowt(["feat/x"], {
      input: "n\n",
      env: { KROWT_AGENT: "envagent" },
    });

    expect(result.code).toBe(0);
    expect(world.stubCalls("envagent")).toHaveLength(1);
    expect(world.stubCalls("myagent")).toHaveLength(0);
  });

  it("prefers the --agent flag over KROWT_AGENT and the config file", async () => {
    const world = new World();
    world.writeStub("myagent");
    world.writeStub("envagent");
    world.writeStub("flagagent");
    writeConfig(world, 'agent = "myagent"\n');

    const result = await world.runKrowt(["--agent", "flagagent", "feat/x"], {
      input: "n\n",
      env: { KROWT_AGENT: "envagent" },
    });

    expect(result.code).toBe(0);
    expect(world.stubCalls("flagagent")).toHaveLength(1);
    expect(world.stubCalls("envagent")).toHaveLength(0);
  });

  it("swaps the git UI via KROWT_GIT_UI", async () => {
    const world = new World({ agent: { action: "write" } });
    world.writeStub("envui");

    const result = await world.runKrowt(["feat/x"], {
      input: "n\n",
      env: { KROWT_GIT_UI: "envui" },
    });

    expect(result.code).toBe(0);
    expect(world.stubCalls("envui")).toHaveLength(1);
    expect(world.stubCalls("lazygit")).toHaveLength(0);
  });

  it("uses a configured worktree_dir for creation and resume", async () => {
    const world = new World();
    writeConfig(world, 'worktree_dir = "wt"\n');
    const expected = join(world.repo, "wt", "feat-x");

    const first = await world.runKrowt(["feat/x"], { input: "n\n" });
    expect(first.code).toBe(0);
    expect(existsSync(expected)).toBe(true);
    expect(existsSync(world.worktreePath("feat/x"))).toBe(false);

    const second = await world.runKrowt(["feat/x"], { input: "n\n" });
    expect(second.code).toBe(0);
    const calls = world.stubCalls("opencode");
    expect(calls).toHaveLength(2);
    expect(calls[1]!.cwd).toBe(expected);
  });

  it("fails clearly on an invalid config value", async () => {
    const world = new World();
    writeConfig(world, "agent = 123\n");

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(".krowt/config.toml");
    expect(result.stderr).toContain("agent");
    expect(existsSync(world.worktreePath("feat/x"))).toBe(false);
  });

  it("fails clearly on unparsable TOML", async () => {
    const world = new World();
    writeConfig(world, "agent = = nope\n");

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(".krowt/config.toml");
  });

  it("fails clearly on an unknown config key", async () => {
    const world = new World();
    writeConfig(world, 'agent_x = "y"\n');

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("agent_x");
  });

  it("never creates .krowt during a normal run", async () => {
    const world = new World();

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(existsSync(join(world.repo, ".krowt"))).toBe(false);
  });
});
