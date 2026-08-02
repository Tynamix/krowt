# krowt

AI coding sessions in isolated git worktrees.

[![npm](https://img.shields.io/npm/v/krowt)](https://www.npmjs.com/package/krowt)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

v0.x · macOS-first · requires Node ≥18 and [opencode](https://opencode.ai) · [lazygit](https://github.com/jesseduffield/lazygit) optional

## Why

`krowt` supports a workflow with many AI coding sessions running at once — each in its own git worktree, on its own branch, in its own terminal. Without that isolation, working this way is fragile:

- Agent experiments mix with your own uncommitted work in your main working tree.
- Parallel sessions collide when several agents share the same files.
- After a session, nothing enforces that the results get committed, pushed, and cleaned up.

`krowt <branch>` wraps all of this in one repeatable command — run it once per branch, in as many parallel terminals as you like.

## Install

```console
$ npm install -g krowt
```

krowt orchestrates two external tools, checked before anything is created:

- **agent** (default `opencode`) — required; krowt aborts with the install command if it's missing.
- **git UI** (default `lazygit`) — optional; a missing git UI only skips the commit/push step.

Both are replaceable — see Configuration below.

## Quickstart

```console
$ cd myrepo
$ krowt feat/login
Created worktree /Users/you/myrepo-worktrees/feat-login
# opencode takes over the terminal — build the feature, then exit
# work is uncommitted → lazygit opens in the worktree: commit & push, then quit
Delete worktree /Users/you/myrepo-worktrees/feat-login? (all work committed and pushed) [Y/n]
Removed worktree /Users/you/myrepo-worktrees/feat-login
```

The branch `feat/login` stays — re-run `krowt feat/login` tomorrow and you're back where you left off.

## How it works

A **Session** is one full `krowt <branch>` run: krowt ensures a worktree exists for the branch (creating it from the **Base** — the freshly fetched remote default branch — if needed), runs your agent in it, checks for **Unsecured work** (uncommitted changes or unpushed commits) when the agent exits and opens your git UI to commit and push, then asks whether to delete the worktree. **Managed worktrees** live together in one sibling directory (`myrepo-worktrees/`); `krowt list` shows them. These four terms are defined in [CONTEXT.md](CONTEXT.md).

- **Resume is the same command** — re-running `krowt <branch>` continues in the still-existing worktree; there is no separate "continue" operation.
- **Parallel sessions** — one per branch, each in its own terminal. A PID lock stops a second session from starting on the same branch; a crashed terminal's stale lock is taken over silently.
- **Works offline** — if fetching the remote fails, krowt warns and branches from your local default branch.
- **Explicit cleanup** — the delete prompt defaults to "yes" when everything is pushed, and to "no" (with the reason) when work is unsecured. Your local branch is never deleted.

## Commands

| Command | Description |
| --- | --- |
| `krowt <branch>` | Start or resume a session for `<branch>` |
| `krowt list` | Show this repository's managed worktrees |
| `krowt init` | Create `.krowt/config.toml` and check your tools |
| `krowt --help` | Full reference: flags, environment variables, config file |

## Configuration

`.krowt/config.toml` at the repository root — created by `krowt init`, committed as team policy, never created implicitly during a normal run:

```toml
agent = "opencode"
git_ui = "lazygit"
worktree_dir = "../myrepo-worktrees"
```

Precedence: CLI flag > environment variable > config file > defaults. All flags and `KROWT_*` environment variables are documented in `krowt --help`.

## The name

krowt is "work" spelled backwards — a crowd of agents working in parallel, from Germany.

## Contributing

Issues and PRs welcome. Tests run with `npm test` — black-box end-to-end tests that drive the real CLI in temporary git repositories with stub agents on `PATH`; no test reaches into internal modules. Domain language lives in [CONTEXT.md](CONTEXT.md), decisions in [docs/adr/](docs/adr/).

## License

MIT
