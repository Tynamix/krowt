# 02 — Branch-Resolution

**What to build:** `krowt <branch>` löst den Branch vollständig auf: Existiert er lokal, wird er ausgecheckt (Fehler mit klarer Meldung, falls er bereits in einem anderen Worktree ausgecheckt ist). Existiert er nur auf dem Remote, wird automatisch ein lokaler Tracking-Branch angelegt. Existiert er nirgends, wird er neu angelegt. Re-Running mit bereits vorhandenem Worktree resumed transparent in denselben Worktree (idempotenter Pfad), inklusive Aufräumen verwaister Worktree-Verzeichnisse, die git nicht mehr kennt.

**Blocked by:** 01 — Scaffold + minimaler Happy Path

**Status:** ready-for-agent

- [x] Lokaler Branch → Worktree wird dafür erstellt/ausgecheckt
- [x] Branch nur auf Remote → lokaler Tracking-Branch wird angelegt
- [x] Branch bereits in anderem Worktree ausgecheckt → klarer Fehler, keine Mutation
- [x] Re-Run bei existierendem Worktree → transparente Fortsetzung, keine Neuerstellung
- [x] Verwaistes Verzeichnis (unbekannt für `git worktree list`) wird vor Neuerstellung aufgeräumt
- [x] Alle Fälle durch die E2E-Seam getestet
