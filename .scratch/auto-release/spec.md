# Spec: Automatische npm-Releases für krowt

krowt soll bei jedem Release automatisch als npm-Package veröffentlicht werden — Versionierung und Changelog aus Conventional Commits, ohne manuelle Versionsarbeit.

## Entscheidungen (siehe docs/adr/0002-automated-npm-releases.md)

- **release-please** auf `main`: pflegt einen Release-PR (Version + `CHANGELOG.md`). Merge = GitHub Release + Tag + npm Publish.
- **0.x-Versionierung**: `feat:` → Minor, `fix:` → Patch, Breaking → Minor (`bump-minor-pre-major`). 1.0.0 ist ein manueller Schritt.
- **npm OIDC Trusted Publishing**: kein Token-Secret; Publish mit Provenance-Attestierung (npm CLI ≥ 11.5.1).
- **CI-Gate**: separater CI-Workflow (typecheck, build, test auf Node 18/20/22) auf PRs und `main`; Publish läuft nur nach grünem Testlauf.
- **Conventional Commits erzwungen**: PR-Title-Check im CI + Squash-Merge-only (Repo-Setting).

## Außerhalb des Repos (manuell)

- npm: Trusted Publisher für `Tynamix/krowt`, Workflow-Datei `release.yml`.
- GitHub: Squash-Merge als einzige Merge-Methode.
