import { spawn } from "node:child_process";
import type { Command } from "./config.js";

export interface RunResult {
  code: number | null;
  signal: NodeJS.Signals | null;
}

export class CommandNotFoundError extends Error {
  constructor(readonly command: string) {
    super(`command not found: ${command}`);
    this.name = "CommandNotFoundError";
  }
}

export function runForeground(
  command: Command,
  opts: { cwd: string; env: NodeJS.ProcessEnv },
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command.bin, command.args, {
      cwd: opts.cwd,
      env: opts.env,
      stdio: "inherit",
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") reject(new CommandNotFoundError(command.bin));
      else reject(err);
    });
    child.on("close", (code, signal) => {
      resolve({ code, signal });
    });
  });
}
