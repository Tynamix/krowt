import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { World } from "./helpers/world.js";

const pkg = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"),
) as { version: string };

describe("--help", () => {
  it("documents commands, flags, env vars and the config file", async () => {
    const world = new World();

    const result = await world.runKrowt(["--help"]);

    expect(result.code).toBe(0);
    const out = result.stdout;
    for (const expected of [
      "krowt <branch>",
      "krowt list",
      "krowt init",
      "--base",
      "--agent",
      "--git-ui",
      "--worktree-dir",
      "--version",
      "KROWT_AGENT",
      "KROWT_GIT_UI",
      "KROWT_SPLASH",
      "KROWT_BRANCH",
      "KROWT_WORKTREE",
      ".krowt/config.toml",
      "Precedence",
      "opencode",
      "lazygit",
    ]) {
      expect(out).toContain(expected);
    }
  });

  it("prints usage to stderr and fails when invoked without arguments", async () => {
    const world = new World();

    const result = await world.runKrowt([]);

    expect(result.code).toBe(1);
    expect(result.stderr.toLowerCase()).toContain("usage");
  });
});

describe("--version", () => {
  it("prints the package version", async () => {
    const world = new World();

    const result = await world.runKrowt(["--version"]);

    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe(pkg.version);
  });
});
