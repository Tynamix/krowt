# 01 — CI-Workflow + PR-Title-Check

**What to build:** `.github/workflows/ci.yml` mit zwei Jobs: (1) `test` — `npm ci`, `npm run typecheck`, `npm test` auf einer Node-Matrix 18/20/22 (package.json verlangt `engines: >=18`), läuft auf PRs und pushes nach `main`; (2) `pr-title` — Conventional-Commit-Check auf den PR-Titel (amannn/action-semantic-pull-request), nur bei PRs.

**Blocked by:** —

**Status:** ready-for-agent

- [ ] CI läuft grün auf PRs und `main` (Matrix 18/20/22)
- [ ] PR mit nicht-konventionellem Titel schlägt fehl
