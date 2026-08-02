# 04 — Change-Check + Git-UI

**What to build:** Nach Agent-Exit prüft krowt auf ungesicherte Arbeit: dirty (`git status --porcelain` nicht leer) ODER ungepushte Commits (Branch ohne Upstream, oder `git log @{u}..HEAD` nicht leer). Trifft eines zu, wird die Git-UI im Worktree im Vordergrund gestartet. Bei sauberem, gepushtem Stand wird der Schritt übersprungen. Fehlt die Git-UI, wird gewarnt und der Schritt übersprungen — der Workflow läuft weiter.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [ ] Dirty Tree → Git-UI startet im Worktree (Vordergrund, geerbtes stdio)
- [ ] Sauberer Tree + ungepushte Commits → Git-UI startet
- [ ] Branch ohne Upstream mit Commits → Git-UI startet
- [ ] Sauber + alles gepusht → kein Git-UI-Start
- [ ] Git-UI nicht installiert → Warnung + überspringen, kein Abbruch
- [ ] Alle Fälle durch die E2E-Seam getestet
