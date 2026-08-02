# 12 — Packaging + Help

**What to build:** krowt wird ein installierbares npm-Paket: `bin`-Eintrag, Build-Pipeline (TypeScript → ausführbar), Paket-Inhalt auf das Nötige beschränkt, sodass `npm i -g krowt` funktioniert. `--help` dokumentiert vollständig: alle Befehle (`<branch>`, `list`, `init`), Flags (`--base`), Env-Vars (`KROWT_AGENT`, `KROWT_GIT_UI`) und die Config-Datei mit Precedence-Regeln.

**Blocked by:** 09 — Preflight + Repo-Discovery, 10 — `krowt init`, 11 — `krowt list`

**Status:** ready-for-agent

- [ ] `npm i -g krowt` installiert ein lauffähiges `krowt`-Binary
- [ ] Paket enthält nur Build-Output + Laufzeit-Dateien
- [ ] `--help` deckt Befehle, Flags, Env-Vars und Config vollständig ab
- [ ] Versions-Angabe (`--version`) vorhanden
- [ ] Globaler Install + Smoke-Test durch die E2E-Seam (oder manuell dokumentiert) verifiziert
