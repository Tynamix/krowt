# 01 — Scaffold + minimaler Happy Path

**What to build:** Ein Node/TypeScript-CLI-Gerüst, das `krowt <branch>` in einem Git-Repo ausführen kann: Es erstellt einen Worktree für den Branch (neuer Branch vom lokalen Default-Branch, falls nicht vorhanden), startet den Agent-Befehl im Vordergrund mit geerbtem stdio im Worktree, und zeigt nach Agent-Exit einen einfachen Lösch-Prompt, der den Worktree bei "ja" entfernt. Enthält außerdem die E2E-Test-Seam: ein Test-Helper, der ein temporäres Git-Repo anlegt, Stub-Executables für Agent/Git-UI auf den PATH legt, das Binary ausführt und danach Dateisystem, Stub-Aufrufe und Ausgabe prüfbar macht.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] `krowt feat/x` legt Branch + Worktree unter `<repo>-worktrees/feat-x` an (Branch-Name sanitisiert: `/` → `-`)
- [x] Agent läuft im Vordergrund mit geerbtem stdio, cwd = Worktree, Env enthält `KROWT_BRANCH` und `KROWT_WORKTREE`
- [x] Nach Agent-Exit kommt ein Lösch-Prompt; "ja" entfernt den Worktree, "nein" lässt alles stehen
- [x] Der lokale Branch bleibt in jedem Fall erhalten
- [x] E2E-Test-Seam existiert und alle obigen Verhalten sind durch sie getestet
- [x] `git worktree list --porcelain` ist die Quelle für Worktree-Erkennung (nicht Verzeichnis-Existenz)
