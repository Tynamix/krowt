# 02 — Release-Pipeline (release-please + npm Publish)

**What to build:** `release-please-config.json` (`release-type: node`, `bump-minor-pre-major: true`), `.release-please-manifest.json` (Startversion `0.1.0`) und `.github/workflows/release.yml`. Der Workflow läuft auf push nach `main`: release-please pflegt den Release-PR; nach dessen Merge (`release_created`) baut und testet der Publish-Job und published mit `npm publish --provenance --access public` per OIDC (`id-token: write`, `npm i -g npm@latest` für Trusted Publishing ≥ 11.5.1). Kein `NODE_AUTH_TOKEN`.

**Blocked by:** 01 — CI-Workflow + PR-Title-Check

**Status:** ready-for-agent

- [ ] Release-PR wird automatisch erstellt/aktualisiert (Version + CHANGELOG.md)
- [ ] Merge des Release-PRs erzeugt GitHub Release + Tag
- [ ] Publish-Job läuft nur bei `release_created` und nach grünem `npm test`
- [ ] Publish ohne gespeichertes npm-Token (OIDC)
