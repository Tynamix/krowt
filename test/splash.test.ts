import { describe, expect, it } from "vitest";
import { renderSplash, type SplashOptions } from "../src/splash.js";

const baseOpts: SplashOptions = { isTTY: true, columns: 120, noColor: false, enabled: true, version: "1.2.3" };

describe("splash", () => {
  it("shows art, version, and tagline on an interactive terminal", () => {
    const output = renderSplash(baseOpts);

    expect(output).toContain("| | ___ __ _____      _| |_");
    expect(output).toContain("1.2.3");
    expect(output).toContain("AI coding sessions in isolated git worktrees");
  });

  it("shows nothing when output is not a terminal", () => {
    const output = renderSplash({ ...baseOpts, isTTY: false });

    expect(output).toBeNull();
  });

  it("shows nothing when the splash is disabled", () => {
    const output = renderSplash({ ...baseOpts, enabled: false });

    expect(output).toBeNull();
  });

  it("falls back to a one-line splash on narrow terminals", () => {
    const output = renderSplash({ ...baseOpts, columns: 20 });

    expect(output).not.toBeNull();
    expect(output).not.toContain("| | ___ __ _____      _| |_");
    expect(output!.trim().split("\n")).toHaveLength(1);
    expect(output).toContain("1.2.3");
    expect(output).toContain("AI coding sessions in isolated git worktrees");
  });

  it("colorizes the art when color is allowed", () => {
    const output = renderSplash(baseOpts);

    expect(output).toContain("\x1b[");
  });

  it("emits no ANSI codes when NO_COLOR is set", () => {
    const output = renderSplash({ ...baseOpts, noColor: true });

    expect(output).not.toContain("\x1b[");
  });
});
