# 09 — Preflight + Repo-Discovery

**What to build:** Vor jeder Mutation prüft krowt die Umgebung: Außerhalb eines Git-Repos → klarer Fehler. Der Aufruf funktioniert aus jedem Unterverzeichnis (Repo-Wurzel via `git rev-parse --show-toplevel`, alle Pfade beziehen sich darauf). Der konfigurierte Agent-Befehl fehlt → harter Abbruch mit dem exakten Install-Befehl in der Meldung, bevor irgendetwas angelegt wird. Die konfigurierte Git-UI fehlt → einmalige Warnung, Workflow läuft ohne sie. Es wird nichts automatisch installiert.

**Blocked by:** 08 — Config-System

**Status:** ready-for-agent

- [ ] Aufruf aus Unterverzeichnis findet die Repo-Wurzel und nutzt sie konsistent
- [ ] Außerhalb eines Repos → klarer Fehler, Exit ≠ 0
- [ ] Agent fehlt → Abbruch mit Install-Hinweis, keine Mutation (kein Branch, kein Worktree)
- [ ] Git-UI fehlt → Warnung einmal zu Beginn, Git-UI-Schritt wird später übersprungen
- [ ] Preflight prüft die konfigurierten (nicht hartcodierten) Befehlsnamen
- [ ] Alle Fälle durch die E2E-Seam getestet
