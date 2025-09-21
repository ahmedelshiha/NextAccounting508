## [2025-09-21] Started CI configuration and quality gates
What I implemented:
- Added GitHub Actions workflow (.github/workflows/ci.yml) to run lint, typecheck, and vitest on push and pull requests.

Why:
- Ensure code quality and catch regressions early via automated checks.

Next steps:
- Run CI in GitHub; iterate on any failures (likely typecheck/lint fixes).
- Configure Netlify preview deploy and smoke tests; document required env variables.
