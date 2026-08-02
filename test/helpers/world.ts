import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, chmodSync, mkdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const CLI = resolve(import.meta.dirname, "../../dist/cli.js");

export interface KrowtResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

export interface StubCall {
  name: string;
  cwd: string;
  argv: string;
  branch: string;
  worktree: string;
}

export interface StubControls {
  action?: "write" | "commit" | "push" | "commitwrite" | "block" | "signal" | "flaky";
  exit?: number;
}

export interface WorldOptions {
  withRemote?: boolean;
  gitUi?: boolean;
  agent?: StubControls;
  gitUiBehavior?: StubControls;
}

function stubScript(name: string): string {
  const upper = stubEnvName(name);
  return `#!/bin/sh
printf '%s\\t%s\\t%s\\t%s\\t%s\\n' "${name}" "$PWD" "$*" "\${KROWT_BRANCH-}" "\${KROWT_WORKTREE-}" >> "$STUB_LOG"
case "\${STUB_ACTION_${upper}-}" in
  write)
    echo "stub change $$ $RANDOM" >> file.txt
    ;;
  commit)
    echo "stub change $$ $RANDOM" >> file.txt
    git add -A >/dev/null 2>&1
    git commit -m "stub commit" >/dev/null 2>&1
    ;;
  push)
    echo "stub change $$ $RANDOM" >> file.txt
    git add -A >/dev/null 2>&1
    git commit -m "stub commit" >/dev/null 2>&1
    git push -u origin HEAD >/dev/null 2>&1
    ;;
  commitwrite)
    echo "stub change $$ $RANDOM" >> file.txt
    git add -A >/dev/null 2>&1
    git commit -m "stub commit" >/dev/null 2>&1
    echo "more $$ $RANDOM" >> file.txt
    ;;
  block)
    touch "$STUB_MARKER"
    while :; do sleep 1; done
    ;;
  signal)
    kill -TERM $$
    ;;
  flaky)
    count=$(cat "$STUB_STATE")
    echo $((count - 1)) > "$STUB_STATE"
    exit "$count"
    ;;
esac
exit "\${STUB_EXIT_${upper}-0}"
`;
}

function stubEnvName(name: string): string {
  return name.replace(/[-a-z]/g, (c) => (c === "-" ? "_" : c.toUpperCase()));
}

export class World {
  readonly root: string;
  readonly repo: string;
  readonly binDir: string;
  readonly stubLog: string;
  readonly stubMarker: string;
  readonly stubState: string;
  readonly gitConfigGlobal: string;
  readonly remote?: string;
  private readonly stubControls = new Map<string, StubControls>();

  constructor(opts: WorldOptions = {}) {
    this.root = realpathSync(mkdtempSync(join(tmpdir(), "krowt-test-")));
    this.repo = join(this.root, "repo");
    this.binDir = join(this.root, "bin");
    this.stubLog = join(this.root, "stub.log");
    this.stubMarker = join(this.root, "stub-started");
    this.stubState = join(this.root, "stub-state");
    this.gitConfigGlobal = join(this.root, "gitconfig");

    mkdirSync(this.binDir, { recursive: true });
    writeFileSync(this.stubLog, "");
    writeFileSync(
      this.gitConfigGlobal,
      ["[user]", "\tname = krowt test", "\temail = krowt@example.com", "[commit]", "\tgpgsign = false", "[init]", "\tdefaultBranch = main", ""].join("\n"),
    );

    this.git(["init", "-b", "main", this.repo]);
    writeFileSync(join(this.repo, "README.md"), "# test repo\n");
    this.git(["-C", this.repo, "add", "-A"]);
    this.git(["-C", this.repo, "commit", "-m", "initial"]);

    if (opts.withRemote) {
      this.remote = join(this.root, "remote.git");
      this.git(["init", "--bare", "-b", "main", this.remote]);
      this.git(["-C", this.repo, "remote", "add", "origin", this.remote]);
      this.git(["-C", this.repo, "push", "-u", "origin", "main"]);
    }

    this.writeStub("opencode", opts.agent);
    if (opts.gitUi !== false) {
      this.writeStub("lazygit", opts.gitUiBehavior);
    }
  }

  get worktreesDir(): string {
    return join(this.root, "repo-worktrees");
  }

  worktreePath(branch: string): string {
    return join(this.worktreesDir, branch.replaceAll("/", "-"));
  }

  writeStub(name: string, controls: StubControls = {}): void {
    const path = join(this.binDir, name);
    writeFileSync(path, stubScript(name));
    chmodSync(path, 0o755);
    this.stubControls.set(name, controls);
  }

  removeStub(name: string): void {
    this.stubControls.delete(name);
    rmSync(join(this.binDir, name), { force: true });
  }

  git(args: string[]): string {
    return execFileSync("git", args, {
      encoding: "utf8",
      env: this.baseEnv(),
    }).trim();
  }

  baseEnv(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      GIT_CONFIG_GLOBAL: this.gitConfigGlobal,
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_TERMINAL_PROMPT: "0",
    };
  }

  krowtEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
      ...this.baseEnv(),
      PATH: this.hermeticPath(),
      STUB_LOG: this.stubLog,
      STUB_MARKER: this.stubMarker,
      STUB_STATE: this.stubState,
    };
    for (const [name, controls] of this.stubControls) {
      const upper = stubEnvName(name);
      if (controls.action) env[`STUB_ACTION_${upper}`] = controls.action;
      if (controls.exit !== undefined) env[`STUB_EXIT_${upper}`] = String(controls.exit);
    }
    return { ...env, ...extra };
  }

  private hermeticPath(): string {
    // Only stubs, git, and system tools — never the developer's real
    // opencode/lazygit/etc. from the ambient PATH.
    let gitDir = "/usr/bin";
    try {
      gitDir = dirname(execFileSync("which", ["git"], { encoding: "utf8" }).trim());
    } catch {
      // fall back to /usr/bin
    }
    return [this.binDir, gitDir, "/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(":");
  }

  runKrowt(
    args: string[],
    opts: { input?: string; env?: NodeJS.ProcessEnv; cwd?: string } = {},
  ): Promise<KrowtResult> {
    return spawnKrowt(args, this.krowtEnv(opts.env), opts.cwd ?? this.repo, opts.input);
  }

  startKrowt(args: string[], opts: { env?: NodeJS.ProcessEnv; cwd?: string } = {}): ChildProcess {
    return spawn(process.execPath, [CLI, ...args], {
      cwd: opts.cwd ?? this.repo,
      env: this.krowtEnv(opts.env),
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });
  }

  worktreeGitDir(worktree: string): string {
    const out = this.git(["-C", worktree, "rev-parse", "--git-dir"]);
    return out.startsWith("/") ? out : resolve(worktree, out);
  }

  readStubLog(): StubCall[] {
    if (!existsSync(this.stubLog)) return [];
    return readFileSync(this.stubLog, "utf8")
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const [name = "", cwd = "", argv = "", branch = "", worktree = ""] = line.split("\t");
        return { name, cwd, argv, branch, worktree };
      });
  }

  stubCalls(name: string): StubCall[] {
    return this.readStubLog().filter((c) => c.name === name);
  }
}

export function spawnKrowt(
  args: string[],
  env: NodeJS.ProcessEnv,
  cwd: string,
  input?: string,
): Promise<KrowtResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`krowt timed out.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, 25_000);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolvePromise({ code, signal, stdout, stderr });
    });
    if (input !== undefined) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}
