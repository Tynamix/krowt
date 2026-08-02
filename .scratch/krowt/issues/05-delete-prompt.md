# 05 — Intelligenter Lösch-Prompt

**What to build:** Der Lösch-Prompt am Session-Ende wird kontextsensitiv: Er zeigt immer den Zustand an (z.B. "alles gepusht", "nichts geändert", "2 uncommitted Dateien, 1 ungepushter Commit") und setzt den Default entsprechend — `[Y/n]` wenn alles gesichert/unverändert, `[y/N]` wenn etwas ungesichert ist. "Ja" bei ungesicherter Arbeit entfernt trotzdem (Force-Remove). Der Prompt kommt immer, auch wenn die Git-UI nicht gestartet wurde.

**Blocked by:** 04 — Change-Check + Git-UI

**Status:** ready-for-agent

- [x] Prompt erscheint nach jeder Session, inklusive der Begründung des Zustands
- [x] Default `Y` bei komplett gepushtem oder unverändertem Stand
- [x] Default `N` bei uncommitted oder ungepushten Änderungen
- [x] "Ja" trotz ungesicherter Arbeit → `git worktree remove --force`
- [x] Lokaler Branch bleibt immer erhalten
- [x] Alle Fälle durch die E2E-Seam getestet
