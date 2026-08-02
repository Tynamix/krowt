import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { World } from "./helpers/world.js";

function advanceRemoteMain(world: World): string {
  const scratch = join(world.root, "scratch");
  world.git(["clone", world.remote!, scratch]);
  writeFileSync(join(scratch, "remote-change.txt"), "from a teammate\n");
  world.git(["-C", scratch, "add", "-A"]);
  world.git(["-C", scratch, "commit", "-m", "advance main on remote"]);
  world.git(["-C", scratch, "push", "origin", "main"]);
  return world.git(["--git-dir", world.remote!, "rev-parse", "main"]);
}

describe("base resolution", () => {
  it("bases new branches on the freshly fetched remote default branch", async () => {
    const world = new World({ withRemote: true });
    const localMainBefore = world.git(["-C", world.repo, "rev-parse", "main"]);
    const remoteHead = advanceRemoteMain(world);
    expect(localMainBefore).not.toBe(remoteHead);

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    const branchHead = world.git(["-C", world.repo, "rev-parse", "refs/heads/feat/x"]);
    expect(branchHead).toBe(remoteHead);
    const localMainAfter = world.git(["-C", world.repo, "rev-parse", "main"]);
    expect(localMainAfter).toBe(localMainBefore);
  });

  it("warns and falls back to the local default branch when there is no remote", async () => {
    const world = new World();
    const localMain = world.git(["-C", world.repo, "rev-parse", "main"]);

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(result.stderr.toLowerCase()).toContain("warning");
    const branchHead = world.git(["-C", world.repo, "rev-parse", "refs/heads/feat/x"]);
    expect(branchHead).toBe(localMain);
  });

  it("warns and falls back to the local default branch when the remote is unreachable", async () => {
    const world = new World();
    world.git(["-C", world.repo, "remote", "add", "origin", join(world.root, "does-not-exist.git")]);
    const localMain = world.git(["-C", world.repo, "rev-parse", "main"]);

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(result.stderr.toLowerCase()).toContain("warning");
    const branchHead = world.git(["-C", world.repo, "rev-parse", "refs/heads/feat/x"]);
    expect(branchHead).toBe(localMain);
  });

  it("warns and falls back to the local default when the fetch fails despite a stale origin/HEAD", async () => {
    const world = new World({ withRemote: true });
    world.git(["-C", world.repo, "remote", "set-head", "origin", "-a"]);
    const remoteHead = advanceRemoteMain(world);
    const localMain = world.git(["-C", world.repo, "rev-parse", "main"]);
    expect(localMain).not.toBe(remoteHead);
    // go "offline": the remote becomes unreachable
    world.git(["-C", world.repo, "remote", "set-url", "origin", join(world.root, "gone.git")]);

    const result = await world.runKrowt(["feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    expect(result.stderr.toLowerCase()).toContain("warning");
    const branchHead = world.git(["-C", world.repo, "rev-parse", "refs/heads/feat/x"]);
    expect(branchHead).toBe(localMain);
  });

  it("branches from the ref given via --base", async () => {
    const world = new World({ withRemote: true });
    world.git(["-C", world.repo, "checkout", "-b", "topic"]);
    writeFileSync(join(world.repo, "topic.txt"), "topic work\n");
    world.git(["-C", world.repo, "add", "-A"]);
    world.git(["-C", world.repo, "commit", "-m", "topic commit"]);
    const topicHead = world.git(["-C", world.repo, "rev-parse", "topic"]);
    world.git(["-C", world.repo, "checkout", "main"]);

    const result = await world.runKrowt(["--base", "topic", "feat/x"], { input: "n\n" });

    expect(result.code).toBe(0);
    const branchHead = world.git(["-C", world.repo, "rev-parse", "refs/heads/feat/x"]);
    expect(branchHead).toBe(topicHead);
  });
});
