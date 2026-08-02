# 03 — Base-Resolution

**What to build:** Neue Branches entstehen von der Base: standardmäßig dem Remote-Default-Branch (`origin/HEAD`) nach best-effort `git fetch`. Schlägt der Fetch fehl (offline, kein Remote), gibt es eine Warnung und es wird vom lokalen Default-Branch gebranched — niemals hart fehlschlagen. Ein `--base <ref>`-Flag überschreibt die Basis explizit.

**Blocked by:** 02 — Branch-Resolution

**Status:** ready-for-agent

- [ ] Online: neuer Branch basiert auf frisch gefetchtem Remote-Default
- [ ] Offline/kein Remote: Warnung + Branch vom lokalen Default, Workflow läuft weiter
- [ ] `--base <ref>` branched vom angegebenen Ref
- [ ] Default-Branch-Erkennung via `origin/HEAD`-Symref mit sinnvollem Fallback
- [ ] Alle Fälle (mit file-basiertem Fake-Remote bzw. ohne Remote) durch die E2E-Seam getestet
