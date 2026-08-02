# krowt

krowt is a CLI that runs AI coding sessions in isolated git worktrees: create a worktree, run an agent in it, commit and push the results, and clean up.

## Language

**Session**:
One full krowt run for a branch: worktree creation, agent run, commit/push via a git UI, and optional cleanup. Multiple sessions run in parallel, each in its own worktree.
_Avoid_: run, job, task

**Base**:
The git ref a new session's branch is created from. Normally the repository's default branch, fetched from the remote when online, local when offline.
_Avoid_: starting point, parent commit

**Unsecured work**:
Anything a session leaves behind that is not safe on a remote: uncommitted changes (dirty tree) or unpushed commits (no upstream, or ahead of upstream). Unsecured work triggers the git UI step and flips the delete prompt default to "no".
_Avoid_: dirty state, pending work

**Managed worktree**:
A worktree that belongs to krowt: located under the configured worktree dir (default `<repo>-worktrees/`), per `git worktree list --porcelain`. `krowt list` shows managed worktrees only.
_Avoid_: session directory
