🚀 Peer Backend – Local CI & Development Guide

File: peer-backend-local-ci-guide.md
Purpose: This document explains how developers run, test, and debug the Peer Backend locally using Docker, Makefile helpers, Gitleaks, PHPStan, and Newman.

1. Overview

The Peer Backend includes a local-first CI system that lets developers:

- run the entire CI pipeline locally
- execute all Postman (Newman) tests
- validate SQL changes
- run PHPStan inside Docker
- build full backend containers
- debug backend logs and DB
- work without affecting CI or production

It mirrors the GitHub Actions pipeline as closely as possible.

2. Requirements

Install the following:

Required

- Docker
- Docker Compose
- make
- jq
- composer
- curl
- PHP CLI (host only, backend uses Docker)
Optional (auto-installed)
- Gitleaks v8.28.0
- jq (auto-install on Linux/WSL)

3. Gitleaks Local Workflow
✔ Pre-commit hooks

Installed via:

```bash
make install-hooks
```

This configures:

- .githooks/pre-commit to run Gitleaks on staged changes
- automatic fallback to Docker if gitleaks binary isn’t installed
- .gitleaks_out/ reports for local review

✔ Manual scan

Run:

```bash
make scan
```

✔ Local ignore file

A local .gitleaksignore file is supported but git-ignored.

Useful for:

- mock data
- UUIDs
- developer fixtures

This file affects only your machine.

4. Environment Files
.env.dev

Used for local development.

.env.ci

Generated automatically:

```bash
make env-ci
```

This ensures environment consistency with CI containers.

Docker Compose always loads:

COMPOSE_ENV_FILE=.env.ci

5. Makefile Architecture

The Makefile is the heart of the local CI system.

Major targets:
Target	     Description
make dev	Full local environment: DB reset, backend build, PHPStan, Newman's init
make test	Run Newman API tests inside Docker
make ci	    Run full local CI (dev → test → cleanup)
make ci2	Run CI in an isolated environment that doesn’t touch dev containers
make reload-backend	        Rebuild & restart backend only
make restart-db	            Reset DB only
make scan	                Local Gitleaks scan on staged changes
make phpstan	            Run PHPStan inside backend container
make logs	                Tail backend logs
make db	                    Open PostgreSQL shell
make bash-backend	        Open shell inside backend container

6. Local Docker Architecture

The backend uses four Docker configurations:

1. Dockerfile.local

The main build for:

- local development
- local CI
- backend container in GitHub Actions

Includes:

- PHP 8.3 + FPM
- NGINX
- Supervisor
- FFmpeg
- Rust + Cargo
- Postgres tools
- PHP extensions (ffi, gmp, pgsql, dom, curl)
- config patch for pg_last_error in CI
- key generation and runtime-data setup

2. Dockerfile.newman

Special container for:

- merging Postman collections
- running Newman tests
- HTMLExtra reporter
- accessing mounted media files

3. docker-compose.override.local.yml

Used when running make dev.

Defines:

- backend exposed to the host at port 8888
- persistent named volume db_data
- bind-mounted src/, runtime-data/, media files
- live code reload
- dev network my-network

4. docker-compose.override.ci.yml

Used only for local CI:

- no exposed ports
- fresh db_data_ci volume per run
- isolated internal networking
- containers destroyed after tests

7. Local CI (make ci)

make ci reproduces the entire GitHub Actions workflow locally.

It performs:

- Environment generation (env-ci)
- DB reset
- Backend build (Dockerfile.local)
- PHPStan (in-container)
- Postman merge
- jq link patching
- Newman API tests
- HTMLExtra report generation
- Cleanup (but keeps reports)

You’ll find reports under:

newman/reports/report.html

8. Isolated CI2 Environment (make ci2)

This mode runs CI in an isolated container set without touching your dev containers.

Workflow:

- Detect existing dev containers
- Temporarily stop them
- Spin up CI2 stack:

backend
Postgres
Newman
isolated network
isolated DB volume (db_data_ci2)

- Run Newman tests
- Clean up CI2 (preserve reports)
- Restart your dev containers

CI2 is perfect for:

- clean testing
- debugging pipeline failures
- validating new Dockerfile changes
- testing SQL migrations on a fresh DB

9. Newman Tests (Local)

make test runs:

- merge-collections.js
- jq transformations:

fix GraphQL URLs
fix upload URLs
fix environment file
fix multipart form-data field "src"

- Execute API tests inside Docker
- Generate HTMLExtra report

Reports stored at:

newman/reports/report.html

10. Bind Mount Behavior

Local dev uses bind mounts for live changes.

Mounted directories:
src/
runtime-data/logs
runtime-data/media/assets
tests/postman_collection
tests/media_files


Changes instantly appear inside the container.

CI mode:

Uses container filesystem + fresh DB volumes
(no bind mounts except tests/media).

11. Local PHPStan Logic
Fast mode:

```bash
make phpstan-fast
```

Runs PHPStan inside the backend container using host vendor/.

Full mode:

```bash
make phpstan
```

Runs:

- composer install
- full PHPStan inside container

Only used when caches must be fully rebuilt.

12. Debugging the Backend
View backend logs:

```bash
make logs
```

Access DB via psql:

```bash
make db
```

Open interactive backend shell:

```bash
make bash-backend
```

Check backend health:
curl http://localhost:8888/health

13. Testing new Dockerfiles locally
Rebuild backend only:

```bash
make reload-backend
```

Full rebuild + reset everything:

```bash
make reset-db-and-backend
```

Clean and rebuild from scratch:

```bash
make clean-all
make dev
```

14. Common Troubleshooting
❌ Port 5432/8888 already in use

Use:

docker stop <container>


Or let make ci2 stop & restart them automatically.

❌ Permission problems

Run once:

```bash
sudo make dev
sudo make clean-all
```

Then re-run normally.

❌ Newman missing files

Ensure media folder is present:

tests/media_files/

❌ Missing SQL files

Ensure:

sql_files_for_import/
exists and contains importer scripts.

❌ Gitleaks failing on macOS

Install manually:

```bash
brew install gitleaks
```

15. Summary Table
Mode	          Dev	                 CI	                    CI2
Ports	       8888 exposed	            none	                none
Network	       my-network	           ci-network	            ci-network
DB	           persistent	          reset on each run	        isolated + reset
Code mounts	   yes	                     yes	                 minimal
Newman	         manual	               automated	             automated
Backend build	  cached	            fresh	                  fresh
Affects dev stack	  yes	             yes	                    no

16. Final Notes

This local CI system gives developers:

- full reproducibility
- local debugging identical to CI
- faster iteration cycles
- stable SQL and static analysis validation
- no need to push to GitHub to test CI behavior

It is one of the most powerful parts of the Peer Backend DevOps platform.