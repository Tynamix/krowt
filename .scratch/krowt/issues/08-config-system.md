# 08 — Config-System

**What to build:** krowt lädt `.krowt/config.toml` (TOML) von der Repo-Wurzel und wendet die Precedence an: CLI-Flag > Env-Var > Config > Defaults. Konfigurierbar sind der Agent-Befehl, der Git-UI-Befehl und der Worktree-Ort; die Env-Vars heißen `KROWT_AGENT` und `KROWT_GIT_UI`. Damit funktioniert der Tool-Austausch Ende zu Ende: `KROWT_AGENT=<stub> krowt feat/x` nutzt ein anderes Tool ohne jede Datei-Änderung. `.krowt/` wird bei normalem Lauf niemals angelegt.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [x] `.krowt/config.toml` (TOML) wird geladen, wenn vorhanden; ungültige Werte → klare Fehlermeldung
- [x] Precedence Flag > Env > Config > Defaults greift für Agent, Git-UI und Worktree-Ort
- [x] `KROWT_AGENT` / `KROWT_GIT_UI` tauschen die Tools zur Laufzeit aus
- [x] Konfigurierter Worktree-Ort wird für Erstellung und Erkennung genutzt
- [x] Ohne Config laufen die Defaults; es wird nichts angelegt
- [x] Alle Precedence-Kombinationen durch die E2E-Seam getestet
