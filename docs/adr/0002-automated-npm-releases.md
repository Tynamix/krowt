# Automated npm releases via release-please and OIDC trusted publishing

krowt is distributed via npm (see ADR-0001) and needs hands-off releases. We decided: release-please runs on every push to `main` and maintains a release PR (version bump + `CHANGELOG.md`, derived from conventional commits). Merging that PR creates a GitHub release + tag and triggers the npm publish, which authenticates via OIDC trusted publishing — no long-lived npm token in the repo. Pre-1.0 versioning follows the standard 0.x convention: `feat:` bumps minor, `fix:` bumps patch, breaking changes bump minor (`bump-minor-pre-major`), so reaching 1.0.0 stays a deliberate manual step.

## Considered Options

- **semantic-release (publish on every merge to main)** — rejected: no review step before publish; a mistyped commit type would ship straight to npm. The release PR keeps a human gate without manual version work.
- **Classic npm automation token** — rejected: long-lived secret that must be stored and rotated. OIDC trusted publishing uses short-lived credentials and adds provenance attestation.
- **changesets** — rejected: built for monorepos; it adds a per-PR chore (writing changeset files) that release-please avoids by deriving everything from conventional commits.

## Consequences

- `main` must stay conventional-commit clean: CI enforces PR titles, and the repo is set to squash-merge only (PR title becomes the commit message).
- One-time manual setup outside the repo: npm trusted publisher entry for `Tynamix/krowt` (workflow `release.yml`) on npmjs.com, plus the squash-only merge setting on GitHub.
- The publish job requires npm CLI ≥ 11.5.1 (trusted publishing), so the workflow upgrades npm explicitly instead of relying on the version bundled with Node.
