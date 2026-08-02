# 07 — Session-Lock

**What to build:** krowt schreibt beim Session-Start eine Lock-Datei (PID + Timestamp) in den Worktree. Ein zweiter `krowt`-Aufruf für denselben Branch bei lebendem Prozess bricht hart ab mit PID und Startzeit der laufenden Session. Ist die PID tot (Terminal abgestürzt, Reboot), wird das stale Lock still übernommen. Bei sauberem Session-Ende wird das Lock entfernt.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [x] Lock-Datei mit PID + Timestamp liegt während der Session im Worktree (nicht im committed `.krowt/`)
- [x] Zweiter Start bei lebender PID → harter Abbruch mit PID + Startzeit, keine Mutation
- [x] Stale Lock (tote PID) → stille Übernahme, Session startet normal
- [x] Lock wird bei sauberem Ende entfernt
- [x] PID-Lebens-Prüfung ist plattform-sicher (macOS)
- [x] Alle Fälle durch die E2E-Seam getestet

## Comments

- Lock file lives at `<worktree-gitdir>/krowt.lock` (via `git rev-parse --git-dir`, i.e. `.git/worktrees/<name>/`), not in the worktree root: a lock file in the worktree root would appear in `git status --porcelain` and permanently trip the dirty check (ticket 04). The gitdir location is still tied to the worktree lifecycle — `git worktree remove` deletes it, `git worktree prune` cleans stale ones — and it is never committable. Covered by the test "never leaves the lock file visible to git status".
