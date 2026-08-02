import { spawn } from "node:child_process";

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
  command: string[],
  opts: { cwd: string; env: NodeJS.ProcessEnv },
): Promise<RunResult> {
  const [bin, ...args] = command;
  if (!bin) return Promise.reject(new Error("empty command"));
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: opts.cwd,
      env: opts.env,
      stdio: "inherit",
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") reject(new CommandNotFoundError(bin));
      else reject(err);
    });
    child.on("close", (code, signal) => {
      resolve({ code, signal });
    });
  });
}
