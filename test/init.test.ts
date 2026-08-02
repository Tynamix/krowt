import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { World } from "./helpers/world.js";

describe("krowt init", () => {
  it("creates a commented config template with all keys", async () => {
    const world = new World();

    const result = await world.runKrowt(["init"]);

    expect(result.code).toBe(0);
    const configPath = join(world.repo, ".krowt", "config.toml");
    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, "utf8");
    expect(content).toContain("agent");
    expect(content).toContain("git_ui");
    expect(content).toContain("worktree_dir");
    expect(content).toMatch(/#.*agent/m);
    // template is valid enough that a normal run still works with defaults
    const session = await world.runKrowt(["feat/x"], { input: "n\n" });
    expect(session.code).toBe(0);
    const agentRuns = world.stubCalls("opencode").filter((c) => !c.argv.includes("--version"));
    expect(agentRuns).toHaveLength(1);
  });

  it("reports found tools with their path", async () => {
    const world = new World();

    const result = await world.runKrowt(["init"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("✓");
    expect(result.stdout).toContain("opencode");
    expect(result.stdout).toContain(join(world.binDir, "opencode"));
  });

  it("reports missing tools with an install hint", async () => {
    const world = new World({ gitUi: false });

    const result = await world.runKrowt(["init"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("✗");
    expect(result.stdout).toContain("lazygit");
    expect(result.stdout).toContain("brew install lazygit");
  });

  it("leaves an existing config untouched", async () => {
    const world = new World();
    mkdirSync(join(world.repo, ".krowt"), { recursive: true });
    const configPath = join(world.repo, ".krowt", "config.toml");
    writeFileSync(configPath, 'agent = "custom"\n');

    const result = await world.runKrowt(["init"]);

    expect(result.code).toBe(0);
    expect(result.stderr + result.stdout).toContain("already exists");
    expect(readFileSync(configPath, "utf8")).toBe('agent = "custom"\n');
  });

  it("fails clearly outside a git repository", async () => {
    const world = new World();

    const result = await world.runKrowt(["init"], { cwd: world.root });

    expect(result.code).toBe(1);
    expect(result.stderr.toLowerCase()).toContain("not inside a git repository");
  });
});
