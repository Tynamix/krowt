# 04 — Change-Check + Git-UI

**What to build:** Nach Agent-Exit prüft krowt auf ungesicherte Arbeit: dirty (`git status --porcelain` nicht leer) ODER ungepushte Commits (Branch ohne Upstream, oder `git log @{u}..HEAD` nicht leer). Trifft eines zu, wird die Git-UI im Worktree im Vordergrund gestartet. Bei sauberem, gepushtem Stand wird der Schritt übersprungen. Fehlt die Git-UI, wird gewarnt und der Schritt übersprungen — der Workflow läuft weiter.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [x] Dirty Tree → Git-UI startet im Worktree (Vordergrund, geerbtes stdio)
- [x] Sauberer Tree + ungepushte Commits → Git-UI startet
- [x] Branch ohne Upstream mit Commits → Git-UI startet
- [x] Sauber + alles gepusht → kein Git-UI-Start
- [x] Git-UI nicht installiert → Warnung + überspringen, kein Abbruch
- [x] Alle Fälle durch die E2E-Seam getestet

## Comments

- Interpretation of "unpushed": the spec sentence "unpushed when the branch has no upstream or `git log @{u}..HEAD` is non-empty" is applied as — upstream exists → `@{u}..HEAD` non-empty; no upstream → commits not reachable from any remote ref (`rev-list HEAD --not --remotes`); no remotes at all → commits ahead of the local default branch. Taken literally ("no upstream" alone = unpushed), every read-only session on a fresh branch would open the git UI, contradicting user story 23 and this ticket's own "Branch ohne Upstream **mit Commits**" checklist item. Recorded during code review.
