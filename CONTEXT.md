# krowt

krowt is a CLI that runs AI coding sessions in isolated git worktrees: create a worktree, run an agent in it, commit and push the results, and clean up.

## Language

**Session**:
One full krowt run for a branch: worktree creation, agent run, commit/push via a git UI, and optional cleanup. Multiple sessions run in parallel, each in its own worktree.
_Avoid_: run, job, task

**Base**:
The git ref a new session's branch is created from. Normally the repository's default branch, fetched from the remote when online, local when offline.
_Avoid_: starting point, parent commit
