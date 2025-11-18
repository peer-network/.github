Peer Backend — Additional CI Workflows

This document explains all supporting CI workflows in the Peer Backend repository.
These are not part of the main backend CI pipeline (Newman, PHPStan, SQL validation, etc.),
but they play a critical role in:

- base image building
- security alert visibility
- Cloudflare Worker deployment for Dependabot notifications
- automated dependency updates

1. build_base_image.yml
Purpose: Build and push the shared PHP Backend Base Image to GHCR

Location: .github/workflows/build_base_image.yml

Why this workflow exists

The backend CI relies on a pre-built, optimized base image:

ghcr.io/peer-network/php-backend-base:latest

This image contains:

- PHP 8.3 FPM
- NGINX
- Supervisor
- FFmpeg
- Rust + Cargo
- PHP extensions (pdo_pgsql, curl, gmp, ffi, zip…)
- System libs
- Composer

Instead of rebuilding these huge dependencies every CI run, we rebuild only when:

- Dockerfile.base changes
- security patches are needed
- we manually trigger it

Triggers
on:
  workflow_dispatch:
  push:
    branches: [development, main, pre-release]
    paths:
      - "Dockerfile.base"
      - ".github/workflows/build_base_image.yml"

What this workflow does:

- Checkout repo
- Log in to GHCR
- Build Dockerfile.base
- Push image to registry

Impact on CI:
- Backends build dramatically faster (minutes → seconds), because most dependencies are pre-baked.


2. dependabot-alerts.yml
Purpose: Send GitHub Dependabot alerts to Discord

Location: .github/workflows/dependabot-alerts.yml

Why this workflow exists

GitHub shows Dependabot alerts in the “Security” tab,
but developers do not check that regularly.

This workflow ensures:

- All vulnerabilities are visible
- Team is notified instantly
- Fixing priority stays high

Triggers

Runs automatically every 6 hours + manual trigger:

schedule:
  - cron: "0 */6 * * *"
workflow_dispatch:

Steps

- Fetch Dependabot alerts via GitHub REST API
- Parse the JSON
- Format each vulnerability into a Discord message
- Send webhook notification to:
${{ secrets.DISCORD_WEBHOOK_DEPENDABOT }}

Message includes

- package name
- severity (Low/Medium/High/Critical)
- patched version
- advisory URL
- count of vulnerabilities

Why this matters

This gives Peer Network organization-wide security visibility.


3. deploy-worker.yml
Purpose: Deploy the Cloudflare Worker that processes Dependabot → Discord Webhooks

Location: .github/workflows/deploy-worker.yml

What the Worker is

Inside worker/ lives a small script that:

- Receives Dependabot events
- Normalizes them
- Sends messages to Discord (fallback when GitHub API is slow or rate-limited)

Trigger

Only runs when Worker code changes:

on:
  push:
    paths:
      - "worker/**"
      - ".github/workflows/deploy-worker.yml"

Workflow steps

Checkout

Install Wrangler CLI

Deploy Worker
(using ${{ secrets.CLOUDFLARE_API_TOKEN }})

Why this is needed

The Worker ensures reliable, fast Dependabot→Discord notifications
even when GitHub API is slow or returns incomplete data.

4. dependabot.yml
Purpose: Automated dependency upgrade configuration

Location: .github/dependabot.yml

Ecosystems managed
Ecosystem	      Directory	    Schedule
Composer (PHP)	    /	        daily
Docker images	     /	        daily
GitHub Actions	    /	          weekly

Why this matters

It ensures:

- PHP dependencies stay up to date
- Docker base images receive security patches
- Actions workflows get new versions
- CI stays secure and fast

This integrates tightly with the dependabot-alerts.yml pipeline.


5. Summary of Supporting CI Workflows
Workflow File	         Purpose	                             Trigger	                                    Output
build_base_image.yml	Build & push GHCR PHP backend base image	On Dockerfile.base changes	 php-backend-base:latest
dependabot-alerts.yml	Send Dependabot alerts → Discord	Cron (6h) & manual	         vulnerability notifications
deploy-worker.yml	 Deploy Cloudflare Worker for alert processing	  Worker changes	   live worker deployment
dependabot.yml	Configure auto-updates for Composer, Docker, Actions	 Daily/weekly	       automatic PRs

6. How These Support the Main Backend CI

These workflows are satellite pipelines that support the main CI:

✔ Base image keeps backend CI fast
✔ Dependabot alerts maintain security
✔ Worker ensures reliable notifications
✔ dependabot.yml reduces outdated dependencies
✔ All integrate into the DevOps Portal for clarity