import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { World } from "./helpers/world.js";

describe("crash-restart loop", () => {
  it("asks to restart when the agent exits non-zero; no continues to the change check", async () => {
    const world = new World({ agent: { action: "write", exit: 1 } });

    const result = await world.runKrowt(["feat/x"], { input: "n\nn\n" });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("code 1");
    expect(result.stderr).toContain("Restart");
    expect(world.stubCalls("opencode")).toHaveLength(1);
    // workflow continued: dirty tree triggered the git UI
    expect(world.stubCalls("lazygit")).toHaveLength(1);
  });

  it("restarts the agent on yes, as often as needed", async () => {
    const world = new World({ agent: { action: "flaky" } });
    writeFileSync(world.stubState, "2");

    const result = await world.runKrowt(["feat/x"], { input: "y\ny\nn\n" });

    expect(result.code).toBe(0);
    expect(world.stubCalls("opencode")).toHaveLength(3);
    const restartPrompts = result.stderr.match(/Restart/g) ?? [];
    expect(restartPrompts).toHaveLength(2);
  });

  it("asks to restart when the agent is killed by a signal", async () => {
    const world = new World({ agent: { action: "signal" } });

    const result = await world.runKrowt(["feat/x"], { input: "n\nn\n" });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("SIGTERM");
    expect(result.stderr).toContain("Restart");
  });

  it("does not ask when the agent exits cleanly", async () => {
    const world = new World();

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(result.stderr).not.toContain("Restart");
  });
});
