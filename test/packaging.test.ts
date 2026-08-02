import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { World } from "./helpers/world.js";

const projectRoot = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")) as {
  version: string;
};

describe("packaging", () => {
  it(
    "npm pack ships only runtime files and the global install runs a full session",
    { timeout: 120_000 },
    async () => {
      const tmp = mkdtempSync(join(tmpdir(), "krowt-pack-"));
      const packOut = execFileSync("npm", ["pack", "--pack-destination", tmp], {
        cwd: projectRoot,
        encoding: "utf8",
      });
      const tarballName = packOut.trim().split("\n").pop()!;
      const tarball = join(tmp, tarballName);

      const entries = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" });
      expect(entries).toContain("package/dist/cli.js");
      expect(entries).toContain("package/package.json");
      expect(entries).not.toContain("package/src/");
      expect(entries).not.toContain("package/test/");

      const prefix = join(tmp, "prefix");
      execFileSync("npm", ["install", "--global", "--prefix", prefix, tarball], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const bin = join(prefix, "bin", "krowt");

      const world = new World();
      const version = await world.runInstalled(bin, ["--version"]);
      expect(version.code).toBe(0);
      expect(version.stdout.trim()).toBe(pkg.version);

      const help = await world.runInstalled(bin, ["--help"]);
      expect(help.code).toBe(0);
      expect(help.stdout).toContain("USAGE");

      const session = await world.runInstalled(bin, ["feat/x"], { input: "n\n" });
      expect(session.code).toBe(0);
      expect(world.stubCalls("opencode")).toHaveLength(1);
      expect(world.stubCalls("opencode")[0]!.cwd).toBe(world.worktreePath("feat/x"));
    },
  );
});
