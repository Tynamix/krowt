# krowt is a Node/TypeScript CLI distributed via npm

krowt's core workflow is pure process orchestration (git worktree, an agent, a git UI), which made a single Bash script the obvious first candidate. We chose Node/TypeScript instead because krowt is meant to be open source: npm distribution (`npm i -g krowt`) matches the target audience (opencode/lazygit users, who all have npm), TypeScript lowers the contributor barrier, and interactive prompts plus tool checks are more robust than in Bash.

## Considered Options

- **Bash script** — rejected: hard to test, excludes Windows users, uninviting for contributors.
- **Go single binary** — rejected: better distribution story, but higher barrier for the JS-affined maintainers and contributors; TTY/prompt handling is more work.

## Consequences

- Windows support is aspirational but not guaranteed in v1; macOS is the primary platform.
- If krowt ever needs to reach non-JS audiences, a Go rewrite means starting over — the workflow spec, not the code, is the durable artifact.
