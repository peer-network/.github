Peer Backend – Docker Compose Architecture

This document explains how the Peer Backend uses Docker Compose for local development, local CI, and production-like testing.
It covers all compose files, networks, volumes, container responsibilities, and how CI achieves reproducibility and isolation.

1. Overview

The Peer Backend uses three Compose layers:

File	                            Purpose
docker-compose.yml	                Base infrastructure shared by all environments
docker-compose.override.local.yml	Local development environment (live bind mounts, logs, Newman testing)
docker-compose.override.ci.yml	     Local CI reproduction environment (clean DB per run, isolated network, CI2 mode)

This modular design gives developers:

- Fully reproducible local CI runs
- Isolated networks per mode
- Separate volumes (dev, CI, CI2)
- The ability to run Newman tests inside Docker

2. docker-compose.yml (Base Stack)

docker-compose.yml defines the minimal infrastructure required to run Peer Backend:

Services

- db (Postgres)

Loads SQL files from sql_files_for_import/ during init

Uses a volume to persist data

- backend (PHP-FPM + NGINX + Supervisor)

Built from Dockerfile.local or production Dockerfile

Exposes port 80 internally

Healthcheck at /health

- newman (Postman runner)

Runs API tests

Mounts Postman collection & media files

Uses HTMLExtra reporter

Key characteristics:

- The base stack does not define ports for db or backend — these are added only in the overrides.
A network called ${COMPOSE_PROJECT_NAME}_network is created automatically.
- Supports healthchecks for dependency ordering.

This base YAML is designed to be reusable for:

- Local dev
- Local CI
- CI2 isolated environment
- Remote CI (GitHub Actions builds images using Dockerfile.local)

3. docker-compose.override.local.yml (Local Development)

This file turns the base stack into a live development server.

3.1 Local backend

Adds:

- Port mapping: 8888:80

- Bind mounts:

./src → /var/www/html/src (live code editing)
./runtime-data/logs → /var/www/html/runtime-data/logs
./runtime-data/media/assets → /var/www/html/runtime-data/media/assets
Backend now watches live PHP code without rebuilds.

3.2 Local DB

- Adds:

Volume: db_data:/var/lib/postgresql/data
Healthcheck via pg_isready

This is your persistent developer database.

3.3 Local Newman

- Mounts:

/tests/postman_collection
/tests/media_files
/newman/reports

- Runs:

Postman -> Newman
HTMLExtra reporter to generate /newman/reports/report.html

3.4 Network

- Uses:

my-network:
  name: ${COMPOSE_PROJECT_NAME}_network


Each developer gets an automatically unique network name like:

"peer_backend_local_wisdom_network"

4. docker-compose.override.ci.yml (Local CI Mode)

This layer creates an ephemeral CI environment that imitates GitHub Actions:

Goals

- Fresh database each run
- No host ports (cannot conflict with dev containers)
- Completely isolated network
- Separate volumes to prevent interference
- Deterministic Newman results

4.1 DB Container

- Volume: db_data_ci:/var/lib/postgresql/data
- Always recreated to simulate GitHub Actions ephemeral runners

4.2 Backend Container

- Built from Dockerfile.local
- No ports exposed
- Uses mounted src + logs
- Healthcheck ensures it is ready before running Newman tests

4.3 Newman Container

- Same as local, but runs inside isolated CI2 network
- Test runner is automated via Makefile target make test

4.4 CI Network
ci-network:
  name: ${COMPOSE_PROJECT_NAME}_ci2_network


Used only for:

- make ci
- make ci2

4.5 Why isolated network?

Because CI should not affect the dev stack.

Example:

If your dev stack is running on ports 5432 and 8888, CI might fail or corrupt the dev database.

CI2 solves this by:

- Stopping dev stack temporarily
- Running isolated CI2 environment
- Restarting dev stack
- Never touching dev data

5. Container Dependency Graph
Local (dev):
db ──healthy──► backend ──► newman (manual test run)

CI mode:
db_ci ──healthy──► backend_ci ──healthy──► newman_ci (automated test run)

CI2 isolated mode:
db_ci2 ──healthy──► backend_ci2 ──► newman_ci2


All environments rely on healthchecks:

Service	       Healthcheck
DB	           pg_isready
Backend	       curl -f http://localhost/health

The Makefile loops until both are healthy before running tests.

6. Volume Behavior
Volume	          Used In	          Purpose
db_data	          Local dev	          Persistent developer database
db_data_ci	      Local CI	          Fresh DB per CI run
db_data_ci2	      CI2 isolated mode	  Fully isolated CI environment
Why so many volumes?

To prevent:

- CI wiping developer data
- CI2 interfering with CI
- Local dev losing test DB content

Each mode gets its own volume namespace based on:

COMPOSE_PROJECT_NAME
COMPOSE_PROJECT_NAME_ci2

7. Network Layout
Network	                               Purpose
${COMPOSE_PROJECT_NAME}_network	       Local dev operations
${COMPOSE_PROJECT_NAME}_ci2_network	   Isolated CI environment

Each developer's dev network is unique, for example:

- peer_backend_local_wisdom_network
- peer_backend_local_jakob_network

Each CI2 run generates a similar isolated network.

Why isolated?

To avoid:

- Port conflicts
- Race conditions
- Healthcheck clashes
- DB collisions between dev and CI

8. How the Backend Waits for the DB

Both override files use:

depends_on:
  db:
    condition: service_healthy


But Compose’s depends_on is not enough, so the Makefile adds:

until pg_isready ...
until curl http://localhost/health ...


This ensures DB and backend are fully ready before Newman tests.

9. Key Generation on Startup

The backend uses RSA keys stored in:

keys/private.key
keys/public.key
keys/refresh_private.key
keys/refresh_public.key


These are usually generated by a script (cd-generate-backend-config.sh), which runs automatically inside Makefile tasks:

- make dev
- make ci
- make ci2

CI never stores real keys — keys are generated inside the container.

10. Media Bind Mounts

Local dev uses:

runtime-data/media/*


CI uses the same structure but in a fresh environment.

Media files (upload tests) come from:

tests/media_files/


These files are injected into Newman container.

All directories under runtime-data/media are gitignored to avoid large repository size.

11. Newman Container Behavior
Local dev:

- Started manually via make test
- Report saved to newman/reports/report.html

Local CI:

- Started automatically by make test
- Uses merged Postman collections
- Uses jq transformations
- HTMLExtra reporter by default

CI2:

- Same as CI, but runs inside a network isolated from dev

This ensures test stability and repeatability.

12. Why CI Resets Volume Every Run

CI must behave like GitHub Actions runners:

- No persistent state
- Clean DB each run
- No leftover transactions
- Reproduce PR behavior reliably

This is why db_data_ci is removed and recreated every run.

Same applies for CI2 with db_data_ci2.

13. How CI Saves Artifacts

Newman writes report inside:

/etc/newman/reports/report.html


Which is bind-mounted to:

newman/reports/


In CI, this folder becomes a GitHub Actions artifact, giving developers a downloadable HTMLExtra report.

Local CI also stores the report for developers to inspect after a run.

14. Summary Table
Component	       Local Dev	        Local CI	   CI2
Ports	            8888	              none	       none
Volumes	           db_data	           db_data_ci	   db_data_ci2
Networks	       my-network	       ci-network	   ci-network
Build	         live bind mounts	   fresh build	   fresh build
Newman	            manual	            automated	   automated
DB lifecycle	   persistent	      reset each run	isolated + reset
Backend wait	healthchecks + Makefile	 healthchecks  healthchecks

15. Final Notes

This Compose architecture is designed to:

- Support a sophisticated local CI framework
- Prevent cross-contamination between dev and test environments
- Provide production-like behavior in containers
- Use deterministic healthchecks and repeatable database state
- Allow fast iteration on Postman/Newman tests
- Give every developer an identical backend environment

It is now a mature, high-level DevOps composition aligning with:

- Docker best practices
- CI/CD reproducibility
- Full local parity with GitHub Actions