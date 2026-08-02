# 06 — Crash-Restart-Loop

**What to build:** Endet der Agent mit Exit-Code ≠ 0 oder durch ein Signal, fragt krowt "Neustarten? [Y/n]". Ja startet den Agent erneut im selben Worktree (beliebig oft wiederholbar). Nein fährt normal mit dem Change-Check fort. Ein Agent-Exit ist für krowt niemals ein Fehler — der Sicherungspfad läuft immer.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [ ] Exit-Code ≠ 0 → Restart-Prompt erscheint
- [ ] Exit durch Signal (z.B. Ctrl-C) → Restart-Prompt erscheint
- [ ] "Ja" → Agent startet erneut im selben Worktree
- [ ] "Nein" → Workflow fährt mit Change-Check fort
- [ ] Sauberer Exit (0) → kein Prompt, normaler Ablauf
- [ ] Alle Fälle durch die E2E-Seam getestet
