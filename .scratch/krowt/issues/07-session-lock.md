# 07 — Session-Lock

**What to build:** krowt schreibt beim Session-Start eine Lock-Datei (PID + Timestamp) in den Worktree. Ein zweiter `krowt`-Aufruf für denselben Branch bei lebendem Prozess bricht hart ab mit PID und Startzeit der laufenden Session. Ist die PID tot (Terminal abgestürzt, Reboot), wird das stale Lock still übernommen. Bei sauberem Session-Ende wird das Lock entfernt.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [ ] Lock-Datei mit PID + Timestamp liegt während der Session im Worktree (nicht im committed `.krowt/`)
- [ ] Zweiter Start bei lebender PID → harter Abbruch mit PID + Startzeit, keine Mutation
- [ ] Stale Lock (tote PID) → stille Übernahme, Session startet normal
- [ ] Lock wird bei sauberem Ende entfernt
- [ ] PID-Lebens-Prüfung ist plattform-sicher (macOS)
- [ ] Alle Fälle durch die E2E-Seam getestet
