# 11 — `krowt list`

**What to build:** `krowt list` zeigt alle aktiven Worktrees/Sessions des Repos als formatierte Übersicht: Branch, Pfad, und ob ein Lock mit lebender PID existiert (Session läuft) bzw. stale ist. Datenquelle ist `git worktree list --porcelain` plus Lock-Dateien. Außerhalb eines Repos → klarer Fehler.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [x] Listet alle krowt-verwalteten Worktrees des Repos mit Branch + Pfad
- [x] Zeigt Lock-Status an (läuft / stale / kein Lock)
- [x] Leeres Ergebnis → freundliche Meldung statt leerer Ausgabe
- [x] Außerhalb eines Repos → klarer Fehler
- [x] Durch die E2E-Seam getestet
