# 11 — `krowt list`

**What to build:** `krowt list` zeigt alle aktiven Worktrees/Sessions des Repos als formatierte Übersicht: Branch, Pfad, und ob ein Lock mit lebender PID existiert (Session läuft) bzw. stale ist. Datenquelle ist `git worktree list --porcelain` plus Lock-Dateien. Außerhalb eines Repos → klarer Fehler.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [ ] Listet alle krowt-verwalteten Worktrees des Repos mit Branch + Pfad
- [ ] Zeigt Lock-Status an (läuft / stale / kein Lock)
- [ ] Leeres Ergebnis → freundliche Meldung statt leerer Ausgabe
- [ ] Außerhalb eines Repos → klarer Fehler
- [ ] Durch die E2E-Seam getestet
