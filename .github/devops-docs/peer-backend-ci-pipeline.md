1. Overview

The Peer Backend CI pipeline ensures that every PR meets strict:

- security rules
- code quality rules
- SQL consistency
- Postman API test coverage
- Docker-based reproducibility
- artifact reporting
- multi-step notifications

The pipeline is composed of multiple stages designed to detect issues early and produce stable production builds.

2. Branch Sync Rules

Before any CI work runs, the workflow enforces:

✅ PR branch must be up-to-date with base (development / main)

The workflow checks:

git rev-list --left-right --count origin/base...origin/pr


If the PR branch is behind the base branch, CI stops immediately:

- No Gitleaks
- No Trivy
- No SQL validation
- No Docker build
- No tests

This ensures developers always test against the latest code and prevents merge conflicts or outdated builds.

3. SQL Validation Rules

The backend enforces strict SQL update policy:

✔ Allowed edits:

- Only 003_additional_data.sql may be modified
- Any newly added XXX_name.sql files are allowed

❌ Not allowed:

- Changing 001_structure.sql
- Changing 002_schema_updates.sql

Editing any SQL file except 003_additional_data.sql

CI will:

- Detect changed SQL files
- Fail fast if invalid modifications are found
- Notify developer via Discord

This prevents accidental breaking schema changes.

4. PHPStan Static Analysis (Inside Docker)

Instead of running PHPStan on the host, CI uses:

- The project’s Dockerfile.local
- Mounted vendor directory
- A lightweight PHP environment

This ensures:

- Same PHP version as production
- Same extensions (FFI, GMP, curl, XML, pgsql)
- Same composer dependencies

PHPStan is executed via:

vendor/bin/phpstan analyse


Any errors cause CI to fail.

5. Gitleaks (Soft Mode)

The backend uses the reusable Gitleaks workflow from .github:

✔ Soft-mode Gitleaks

- CI does not fail if leaks are discovered in runtime logs
- CI does fail if leaks appear in code diffs
- Report uploaded as artifact
- Developer notified via Discord

Soft mode ensures developers can see leaks immediately without blocking builds caused by harmless false-positives.

6. Docker Build + docker-compose Up (CI Stack)

CI builds full backend + DB stack:

✔ Dockerfile.local used for CI
✔ docker-compose.override.ci.yml provides:

- isolated ci-network
- fresh Postgres volume
- backend + DB healthchecks
- no exposed ports
- fast reproducible container environment

Database initialization loads all SQL files in sql_files_for_import/.

Backend container is built with:

- FFmpeg
- Rust (for TokenCalculations)
- PHP-FPM
- Supervisor
- NGINX

This ensures the CI container fully matches production logic.

7. NGINX + Supervisor Config Generation

CI includes a step to:

✔ Generate backend config files

These handle:

- nginx routing
- supervisor services
- php.ini overrides
- FFmpeg configuration

This ensures config generation is always identical between dev, CI, and production.

8. Postman Collections – jq Transformation

The backend CI needs Postman/Postman collections to:

- Target the correct container URLs
- Correctly attach media files for multipart/form-data
- Merge multiple Postman collections into a unified temp collection

CI runs a full jq transformation chain:

- Transform #1 – Update GraphQL URLs

Replace raw URL with:

http://backend/graphql

- Transform #2 – Fix media upload URLs

Fix upload endpoint to:

http://backend/upload-post

- Transform #3 – Inject BACKEND_URL environment variable

Ensures tests run in Docker and not host.

- Transform #4 – Fix "src" fields for GraphQL file uploads

"src": ["file.png"] → "src": [{"file":"file.png"}]

This solves Newman v5+ incompatibility with multipart GraphQL uploads.

9. Newman Run (Dockerized API Tests)

The newman service:

- Runs inside docker-compose
- Uses Dockerfile.newman
- Includes HTMLExtra reporter
- Mounts media files into container
- Generates /etc/newman/reports/report.html

CI executes:

newman run tmp_collection.json --environment tmp_env.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/report.html

Output:

- detailed CLI output
- HTMLExtra report uploaded to GitHub Actions artifacts

Failures in any test → CI fails.

0. HTMLExtra Report Upload

The workflow uploads:

- report.html
- any supporting JS/CSS assets

This gives developers a full visual test report.
The same report is published to the peer-backend-reports repo via PAT token.

11. Matrix Aggregation Logic

Backend CI runs multiple Postman collections:

- 001 main tests
- 002 extended tests
- 003 heavy tests / media tests

They are merged using:

merge-collections.js


Then executed in sequence.

If any collection fails:

- final check marks CI as failed
- but all reports are still uploaded

12. Trivy (Image + Filesystem Scan)

Backend CI performs two types of Trivy scans:

✔ Filesystem scan (using reusable workflow)

Scans the repo for:

- critical vulnerabilities
- high vulnerabilities

✔ Docker Image scan (Trivy CLI)

After backend Docker image is built:

trivy image peer-backend:${GITHUB_SHA}


Any HIGH/CRITICAL issue → triggers Discord alert.

13. Unified Discord Notification Job

The backend uses a single Discord-notification system that handles:

PR branch behind → warning
Gitleaks → failure
Trivy → vulnerability alert
Newman → test failure
SQL validation → schema alert
PHPStan → static analysis failure
Success → team lead tagged

Messages include:

- PR title
- PR URL
- CI run URL
- author mention
- instructions for developers

This ensures communication is centralized across all CI outcomes.

14. Deployment of Reports to peer-backend-reports

A PAT token (REPORTS_DEPLOY_TOKEN) pushes:

/reports/<PR-number>/<timestamp>/


Only the latest 10 reports are kept.

Older ones are deleted automatically to avoid repo bloat.

15. Final CI Decision Logic

The workflow's final final_check stage determines:

❌ Fail if:

- branch is behind
- Gitleaks fails
- SQL policy violated
- PHPStan fails
- Newman tests fail
- Critical Trivy vulnerabilities detected

✔ Success if:

- Everything passes.
Special cases:

- Gitleaks skipped for outdated branch
- Trivy soft mode does not fail CI
- Reports always uploaded (even on failure)

16. Summary Diagram
PR → Branch Sync → SQL Validation → PHPStan → Docker Build
   → Newman Tests → Gitleaks → Trivy FS → Trivy Image
   → Report Upload → Discord Notification → Final Check