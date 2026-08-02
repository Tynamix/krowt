Status: ready-for-agent

# krowt — AI coding sessions in isolated git worktrees

## Problem Statement

Running AI coding agents in the main working tree is fragile: agent experiments mix with your own uncommitted work, running several agents in parallel is practically impossible without collisions, and after a session there is no enforced path that gets the results committed, pushed, and the workspace cleaned up. The user wants to fire a single command in any repo and get a safe, repeatable session workflow — many times in parallel.

## Solution

`krowt <branch>` runs a **Session**: it ensures a worktree exists for the branch (creating branch and worktree if needed), launches the configured agent inside it with full terminal control, and when the agent exits, checks for unsecured work (uncommitted changes or unpushed commits). If any exists, the configured git UI is opened to commit and push. Afterwards krowt always asks whether to delete the worktree, with a safety-dependent default. Multiple sessions run in parallel, one per branch, each in its own worktree.

## User Stories

1. As a developer, I want to run `krowt feat/login` in my repo, so that a worktree and branch are created and my agent starts there without any manual setup.
2. As a developer, I want new branches to be created from the **Base** (the default branch, freshly fetched when online), so that every session starts from the same current state.
3. As a developer, I want krowt to fall back to the local default branch with a warning when offline or when no remote exists, so that the tool works on trains and planes.
4. As a developer, I want a `--base <ref>` flag, so that I can deliberately branch off something else in rare cases.
5. As a developer, I want `krowt <branch>` to check out an existing local branch, so that I can continue work I started earlier.
6. As a developer, I want a branch that exists only on the remote to become a local tracking branch automatically, so that I can work on a teammate's branch (or my own pushed one) without manual git commands.
7. As a developer, I want a clear error if the branch is already checked out in another worktree, so that git's constraint doesn't surface as a confusing failure.
8. As a developer, I want re-running `krowt feat/login` to transparently resume into the still-existing worktree, so that "new session" and "continue session" are the same command.
9. As a developer, I want all worktrees of a repo collected in one sibling directory (`<repo>-worktrees/`), so that I can see all my sessions with a single `ls`.
10. As a developer, I want branch names sanitized for directory names (`feat/login` → `feat-login`), so that nested branches don't create nested paths.
11. As a developer, I want the worktree location configurable, so that teams can adapt it to their conventions.
12. As a developer, I want to run many sessions in parallel (one terminal each), so that a crowd of agents can work on different features simultaneously.
13. As a developer, I want a second `krowt feat/login` while a session is already running to abort hard with a clear message (PID, start time), so that two agents never edit the same files.
14. As a developer, I want a stale lock (dead PID) to be taken over silently, so that a crashed terminal never blocks me.
15. As a developer, I want krowt to abort before creating anything if the agent command isn't installed, with the exact install command in the message, so that I never get an orphan worktree.
16. As a developer, I want only a warning if the git UI is missing (the workflow continues without it), so that a missing optional tool doesn't block my session.
17. As a developer, I want the agent to take over my terminal completely (inherited stdio, foreground), so that its TUI works exactly as when run directly.
18. As a developer, I want the agent process to receive `KROWT_BRANCH` and `KROWT_WORKTREE` env vars, so that tooling can detect it's inside a krowt session.
19. As a developer, I want to be asked whether to restart the agent when it exits with an error, so that a crash doesn't force me to redo setup.
20. As a developer, I want "no restart" to continue to the change check, so that even a crashed agent's work is secured.
21. As a developer, I want the git UI to open automatically when the agent leaves uncommitted changes, so that committing and pushing is one keystroke away.
22. As a developer, I want the git UI to also open when there are unpushed commits (including when the agent committed by itself, and when the branch has no upstream yet), so that no work stays local unnoticed.
23. As a developer, I want the git UI step skipped when everything is clean and pushed, so that read-only sessions don't add friction.
24. As a developer, I want to always be asked whether to delete the worktree after a session, so that the cleanup decision is explicit and uniform.
25. As a developer, I want the delete prompt to default to "yes" when all work is pushed (or nothing changed), so that finished sessions clean up with one Enter.
26. As a developer, I want the delete prompt to default to "no" and show the reason (e.g. "2 uncommitted files, 1 unpushed commit") when work is unsecured, so that I can't lose work by hitting Enter too fast.
27. As a developer, I want answering "yes" to deletion with unsecured work to still delete (force), so that throwing away a failed experiment stays possible.
28. As a developer, I want my local branch to survive worktree deletion, so that I can resume later and never lose refs.
29. As a developer, I want `krowt list` to show all active worktrees/sessions of the repo, so that I keep an overview over parallel sessions.
30. As a developer, I want `krowt init` to create a commented `.krowt/config.toml` template and report which required tools are installed, so that onboarding a repo is one command.
31. As a developer, I want krowt to never create `.krowt/` implicitly during a normal run, so that no committable file appears as a side effect.
32. As a developer, I want configuration layered as flag > env var > `.krowt/config.toml` > defaults, so that team policy (committed) and personal overrides (env) compose predictably.
33. As a developer, I want the agent and git UI commands replaceable (`KROWT_AGENT`, `KROWT_GIT_UI` or config), so that I can swap opencode/lazygit for other tools.
34. As a developer, I want to run krowt from any directory inside the repo, so that I don't have to `cd` to the root first.
35. As a developer, I want a clear error when running krowt outside a git repository, so that typos in the wrong terminal don't confuse me.
36. As a developer, I want `krowt --help` to document all commands, flags, env vars, and the config file, so that the tool is self-explanatory.
37. As a developer, I want to install krowt via `npm i -g krowt`, so that setup matches my existing JS toolchain.

## Implementation Decisions

- **Stack:** Node.js + TypeScript CLI, published to npm as `krowt` (name verified available). See `docs/adr/0001-node-typescript-cli.md`.
- **Module shape:** one CLI entry (arg parsing, help text, command dispatch); a session orchestrator that drives the workflow as a linear pipeline (preflight → ensure branch → ensure worktree → acquire lock → run agent → change check → maybe git UI → delete prompt → release lock); a thin git adapter shelling out to the `git` CLI (worktree add/list/remove, branch creation incl. tracking, fetch, status, upstream comparison); a process runner spawning agent and git UI in the foreground with inherited stdio; a config loader (TOML) implementing the precedence chain; a preflight checker doing `PATH` lookups; a lock manager (PID file); a prompter for y/N questions with context-dependent defaults.
- **Commands v1:** `krowt <branch>` (default), `krowt list`, `krowt init`, plus `--help`, `--base <ref>`.
- **Branch resolution order:** local branch exists → use it (error if checked out in another worktree) · else remote branch exists → create local tracking branch · else create new branch from Base.
- **Base resolution:** `--base` flag wins; otherwise the remote's default branch (`origin/HEAD`) after a best-effort `git fetch`; fetch failure (offline/no remote) → warning + local default branch.
- **Worktree location:** sibling directory `<repo-root-name>-worktrees/`, leaf = branch name with `/` replaced by `-`. Overridable via config key (e.g. `worktree_dir`).
- **Resume:** worktree discovery goes through `git worktree list --porcelain`, never through directory existence alone; a leftover directory unknown to git is cleaned up before recreation.
- **Lock:** PID + timestamp file inside the worktree (not in committed `.krowt/`). Live PID → hard abort with message. Dead PID → silent takeover. Removed on clean exit.
- **Agent run:** foreground, inherited stdio, cwd = worktree, env extended with `KROWT_BRANCH` and `KROWT_WORKTREE`. Non-zero exit or signal → prompt "restart agent? [Y/n]"; yes → relaunch in same worktree; no → continue. Agent exit is never a krowt failure.
- **Change check:** dirty when `git status --porcelain` is non-empty; unpushed when the branch has no upstream or `git log @{u}..HEAD` is non-empty. Dirty OR unpushed → launch git UI in the worktree (foreground, inherited stdio).
- **Delete prompt:** always shown, includes the reason and a safety-dependent default — `[Y/n]` when fully pushed/unchanged, `[y/N]` when anything is unsecured. "Yes" with unsecured work removes with `git worktree remove --force`. The local branch is never deleted.
- **Config:** `.krowt/config.toml` (TOML, committed, team policy). Precedence: CLI flag > env var (`KROWT_AGENT`, `KROWT_GIT_UI`, …) > config file > built-in defaults. Created only by `krowt init` (commented template + tool check report); never auto-created on normal runs.
- **Preflight:** before any mutation — agent command missing → abort with the exact install command in the message; git UI missing → warn once, continue (git UI step is skipped later); not inside a git repo → clear error. Repo root resolved via `git rev-parse --show-toplevel`.
- **Platform:** macOS first; no auto-installation of tools anywhere.

## Testing Decisions

- **One seam, the highest one:** the CLI binary itself, exercised black-box in real temporary git repositories (with a file-based fake remote). The agent and git UI are replaced by stub executables placed on `PATH` that log their invocations (argv, cwd, env) and simulate behavior (write files, create commits, exit codes). Interactive prompts are answered via stdin.
- **Good test = external behavior only:** worktree exists at the expected path, branch points at the expected ref, stub was called in the right cwd with the right env, prompt text and default are correct, worktree gone after "yes", branch still present, lock file behavior on second start. No test reaches into internal modules.
- **Tested through this seam:** the full session pipeline, branch resolution (new/local/remote-only/occupied), online-offline base fallback (no remote in the temp repo), resume, double-start lock, crash-restart loop, change detection (dirty, unpushed, no-upstream, clean), delete prompt defaults and force-remove, `list`, `init`, config precedence (config file + env + flag combinations), tool swapping via env, run-from-subdirectory, outside-repo error.
- **Prior art:** none in this repo (greenfield). The approach follows standard CLI E2E practice: a test helper that assembles a temp repo + stub bin dir + env, runs the binary, and exposes the world afterwards (filesystem, stub logs, captured output). `node:test` or vitest as runner — pick one and use it consistently.

## Out of Scope

- Auto-installation of missing tools (deliberately rejected: check + message only).
- `krowt clean` (garbage-collecting merged local branches) and `krowt rm` (manual worktree removal) — possible fast-follows, not v1.
- Windows and Linux installer/package support; Windows support aspirational at best.
- Terminal multiplexing (tmux), spawning new terminal windows, or a session dashboard UI.
- Hooks/plugin system beyond the two replaceable commands.
- Non-interactive/CI mode (beyond the existing flag/env overrides).
- Creating pull requests or merging.

## Further Notes

- Name: `krowt` = "work" backwards (krow) + a nod to "Kraut" (from Germany) and "crowd" — a crowd of agents working in parallel. Free on npm at spec time.
- Domain language lives in `CONTEXT.md` (**Session**, **Base**); the stack decision lives in `docs/adr/0001-node-typescript-cli.md`.
- Everything in this spec was decided in a grilling session on 2026-08-01; the spec is the single source of truth for v1 behavior.
