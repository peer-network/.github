🏛 Peer Backend – Architecture Overview

This document explains how the Peer Backend works end-to-end:
from NGINX, to PHP, to Docker, to CI/CD, to automated testing, and notifications.

Perfect for new developers onboarding into the Peer Network backend.

1. High-Level Architecture
Client (Web / Mobile / Postman / CI)
        ↓
     NGINX (web server)
        ↓
    PHP-FPM (PHP runtime)
        ↓
   SlimPHP Framework
        ↓
   PostgreSQL Database


Everything runs inside Docker containers (local & CI).

2. What Happens When the Backend Runs?

1️⃣ NGINX

- Receives HTTP requests
- Routes /graphql and /upload → PHP-FPM
- Serves assets from runtime-data/media/

2️⃣ PHP-FPM

- Executes PHP code inside Slim
- Calls business logic
- Handles authentication
- Runs GraphQL engine

3️⃣ SlimPHP

- The application framework
- Resolves resolvers, validation, services, controllers
- Uses DI container
- Sends queries to DB

4️⃣ PostgreSQL

- All user, posts, wallets, transactions, and media relations live here
- DB initialized from SQL files in sql_files_for_import
- Healthchecked before backend starts

3. Supervisor Controls Everything Inside Container

The backend container uses Supervisor to keep processes alive:

Supervisor
  ├── NGINX
  ├── PHP-FPM


Benefits:

- Automatic restarts
- No process crashes
- Clear log separation
- Works reliably in CI & dev

4. Backend Build Pipeline (Docker)

The backend container is built from:

Dockerfile.local (Dev & CI)

Includes:

- PHP 8.3
- NGINX
- Supervisor
- Rust + Cargo
- FFmpeg
- PHP extensions: curl, dom, gmp, pgsql, ffi
- Composer
- Key generation (private.key, public.key)
- Runtime folders & logs
- Patch for pg_last_error (CI only)

docker-compose.yml

Defines:

- backend
- db
- newman

with networks and volumes.

5. Local Development Architecture

Local development uses:

- docker-compose.yml      Defines core services (backend/db/newman). Shared by dev & CI.
- docker-compose.override.local.yml
- Dockerfile.local


Key behavior:

Component	             Description
Backend	               exposed at http://localhost:8888
DB	                   persistent volume db_data
Code	               bind-mounted for live reload
Logs	               stored under runtime-data/logs
Media	               bind-mounted from host → container

Developers use:

make dev
make reload-backend
make restart-db
make test

6. CI Architecture (GitHub Actions)

CI uses:

- docker-compose.yml
- docker-compose.override.ci.yml
- Dockerfile.local
- Dockerfile.newman


Behavior:

Component	               Description
Backend	                   runs without exposed ports
DB	                       fresh DB volume each run (db_data_ci)
Newman	                   runs API tests automatically
Reports	                   stored as artifacts for download

CI ensures:

- SQL validation
- PHPStan static analysis
- Gitleaks secrets detection
- Trivy vulnerability scan
- Full Postman/GraphQL test suite
- Discord notifications

7. Newman API Testing

In CI and locally, Newman:

- Merges 3 Postman collections
- Applies jq patches to fix:

URLs
GraphQL paths
upload paths
multipart file formats

- Runs full test suite inside Docker
- Produces an HTMLExtra report

Saved as:

newman/reports/report.html


and uploaded to GitHub Actions artifacts.

8. Security Layers
8.1 Gitleaks (Secrets Scanning)

Checks:

- staged changes (local pre-commit hook)
- PR diff (CI reusable workflow)

Finds:

- API keys
- tokens
- secrets
- private keys

Runs in soft mode, meaning:

- it fails PRs
- but doesn’t block repository pushes
- produces downloadable Gitleaks report
- notifies developers on Discord

8.2 Trivy (Vulnerability Scanning)

Checks:

- dependencies
- operating system libraries
- Dockerfile build layers

Runs in soft mode:

- alerts about HIGH/CRITICAL vulnerabilities
- creates a Trivy report
- notifies on Discord
- does not block merge unless team decides

9. Unified Discord Notifications

At the end of CI, a single job decides:

- success
- outdated PR branch
- Gitleaks detected secrets
- Trivy found vulnerabilities

Message includes:

- PR title
- PR link
- author mention
- run URL
- direct links to artifacts

This keeps the entire team informed.

10. Full System Diagram
                  ┌───────────────────────────────────┐
                  │            Developer               │
                  │   (GitHub PR / Push / Local CI)   │
                  └───────────────────┬────────────────┘
                                      │
                             GitHub Actions CI
                                      │
        ┌────────────────────────────────────────────────────────┐
        │                    CI Pipeline Stages                   │
        │  • Branch sync check                                    │
        │  • Gitleaks scan (secrets)                              │
        │  • PHPStan static analysis                              │
        │  • SQL validation                                       │
        │  • Docker backend build                                 │
        │  • Backend startup healthcheck                          │
        │  • Newman API tests (GraphQL + upload-post)             │
        │  • Trivy scan (image + filesystem security)             │
        │  • Artifact upload (HTMLExtra reports + logs)           │
        │  • Unified Discord notifications                        │
        └───────────────────────────────┬─────────────────────────┘
                                        │
                         NEWMAN HTMLExtra REPORT (CI)
                                        │
                              Backend validated
                                        │
                               Ready for deployment

11. Summary for New Developers
The Peer Backend architecture consists of:

- NGINX routing
- PHP-FPM execution
- SlimPHP application layer
- PostgreSQL database
- Supervisor process management
- Docker containerized runtime
- Makefile controlling local dev & CI simulators
- Newman testing framework
- Gitleaks secret scanning
- Trivy vulnerability scanning
- Discord unified notifications

Environments:
Mode	                 Purpose
Local Dev	            Daily development with live code reload
Local CI	            Full simulation of GitHub Actions
CI2	                    Clean isolated test environment
GitHub Actions	        Production CI pipeline

This file gives new hires everything they need to understand how the backend works at a high level.