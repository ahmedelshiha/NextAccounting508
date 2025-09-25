# Security Scan & Remediation Guide

This document explains how to run Semgrep and dependency scans, interpret results, and remediate critical/high findings.

1. Running scans locally
- Semgrep: Install semgrep (pip install semgrep) and run: semgrep --config .semgrep/default.yml
- PNPM audit: pnpm audit --json > pnpm-audit.json
- Snyk: snyk test (requires SNYK_TOKEN env var and account)

2. Interpreting Semgrep findings
- Errors: prioritize fixes for ERROR severity (e.g., eval usage, new Function).
- Warnings: review and decide remediation or accept with justification and tests.
- For each finding:
  - Identify the file and line.
  - Create a GitHub issue with rule id, file, lines, and suggested fix.
  - Fix the code or add a narrow exception with an inline comment and test.

3. Interpreting pnpm audit / Snyk
- Review pnpm-audit.json for advisories.
- For critical/high vulnerabilities:
  - Attempt to upgrade the affected package to a patched version. Prefer non-breaking updates.
  - If direct upgrade is impossible, consider adding a resolution override in package.json or contacting the package maintainer.
  - If package is a devDependency and does not affect runtime, document acceptance and mitigate in CI if necessary.

4. Automating fixes
- Dependabot will open PRs for dependency updates weekly (.github/dependabot.yml).
- For recurring issues, add upgrade strategies or pin versions.

5. CI integration
- The GitHub Action .github/workflows/security-scan.yml will run Semgrep and pnpm audit on PRs and main pushes.
- If SNYK_TOKEN is provided in repository secrets, Snyk test will run as well.
- The job fails if high/critical vulnerabilities are found (pnpm audit). Adjust thresholds as needed.

6. Next steps after remediation
- Re-run the security-scan GitHub Action and confirm success.
- Merge dependency update PRs after review and testing.
- Schedule periodic security review and assign owners for triage.
