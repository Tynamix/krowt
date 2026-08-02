# 03 — npm- und Repo-Setup (manuell)

**What to build:** Einmalige manuelle Einrichtung außerhalb des Repos. Auf npmjs.com: Trusted Publisher für das Package `krowt` einrichten (GitHub-Repo `Tynamix/krowt`, Workflow-Datei `release.yml`, ggf. zuerst ein einmaliger manueller `npm publish`, damit das Package existiert). Auf GitHub: Repo-Settings → Merge-Methoden auf Squash-only stellen. Danach End-to-End-Verifizierung: ein `fix:`-PR mergen → Release-PR erscheint → mergen → Release + npm-Version da.

**Blocked by:** 02 — Release-Pipeline (release-please + npm Publish)

**Status:** ready-for-human

- [ ] Trusted Publisher auf npmjs.com konfiguriert (Repo + `release.yml`)
- [ ] Squash-Merge als einzige Merge-Methode aktiv
- [ ] Erster echter Release End-to-End verifiziert (`npm view krowt` zeigt die Version)
