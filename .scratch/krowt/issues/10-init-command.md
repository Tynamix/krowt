# 10 — `krowt init`

**What to build:** `krowt init` legt an der Repo-Wurzel ein kommentiertes `.krowt/config.toml`-Template an (alle Schlüssel mit erklärenden Kommentaren und Defaults) und gibt danach einen Tool-Check-Report aus: für Agent und Git-UI jeweils ✓ gefunden (mit Version/Pfad) oder ✗ fehlt (mit Install-Hinweis). Bestehende Config wird nicht überschrieben. Es wird nichts installiert.

**Blocked by:** 08 — Config-System

**Status:** ready-for-agent

- [x] Erzeugt `.krowt/config.toml` als kommentiertes Template mit allen Schlüsseln
- [x] Tool-Check-Report zeigt ✓/✗ pro Tool inkl. Install-Hinweis bei ✗
- [x] Bestehende Config bleibt unangetastet (klare Meldung statt Überschreiben)
- [x] Außerhalb eines Repos → klarer Fehler
- [x] Durch die E2E-Seam getestet
