# 06 — Crash-Restart-Loop

**What to build:** Endet der Agent mit Exit-Code ≠ 0 oder durch ein Signal, fragt krowt "Neustarten? [Y/n]". Ja startet den Agent erneut im selben Worktree (beliebig oft wiederholbar). Nein fährt normal mit dem Change-Check fort. Ein Agent-Exit ist für krowt niemals ein Fehler — der Sicherungspfad läuft immer.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [x] Exit-Code ≠ 0 → Restart-Prompt erscheint
- [x] Exit durch Signal (z.B. Ctrl-C) → Restart-Prompt erscheint
- [x] "Ja" → Agent startet erneut im selben Worktree
- [x] "Nein" → Workflow fährt mit Change-Check fort
- [x] Sauberer Exit (0) → kein Prompt, normaler Ablauf
- [x] Alle Fälle durch die E2E-Seam getestet
