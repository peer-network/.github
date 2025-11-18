#️⃣ Overview

The Peer Backend runs entirely inside Docker containers using a multi-file architecture:

Dockerfile.base → foundational build (dependencies, PHP extensions, Rust, FFmpeg)

Dockerfile → production build (final backend image)

Dockerfile.local → optimized for local development (bind mounts, local logs)

Dockerfile.newman → Postman/Newman test runner used in CI/local CI

NGINX + PHP-FPM + Supervisor → runtime stack inside the backend container

runtime-data/logs → centralized logging system for GraphQL + application logs

FFI enabled → required for Rust token-calculation library

Security patches + key generation → auto-generated RSA keys & CI-only hardening

This document explains exactly how the backend container is built, why each component is included, and how the runtime architecture works.

#️⃣ 1. Dockerfile.base – Foundational Image

Dockerfile.base builds the base layer for all production and CI images.

✔ Contains all system-level dependencies

- Installed via apt-get:

nginx (reverse proxy)
supervisor (process manager)
ffmpeg (media processing)
postgresql-client (CI DB checks)
- PHP build dependencies:
libpq-dev, libzip-dev, libxml2-dev, libcurl-openssl-dev
libgmp-dev, libffi-dev, zlib1g-dev

- General tools:
git, curl, unzip, openssl

Why?

- The backend requires:
ffmpeg for media transformation
postgresql-client for health checks & migrations
gmp for cryptographic math
ffi for Rust bindings

✔ PHP Extensions Installed

- From source:
pgsql, pdo_pgsql
bcmath
xml
curl
gmp
ffi

- Why FFI?

The backend uses a Rust library (tokencalculation) for certain cryptographic/token-related operations.
FFI must be:

compiled into PHP

enabled via php.ini at runtime.

✔ Rust Environment (rustup, cargo)

- Why Rust?

Token calculations require high performance.

Rust library is compiled inside the container for both production & local CI.

- The base Dockerfile installs:

curl https://sh.rustup.rs | sh -s -- -y


Then adds Cargo to PATH.

✔ Sets Workdir
WORKDIR /var/www/html


All application code is copied here during the production Dockerfile.

#️⃣ 2. Dockerfile – Production Backend Build

- Dockerfile is used by:

docker-compose.yml in CI

production/staging deployments

This file builds the real backend image from the php-backend-base.

✔ Steps in the Dockerfile
1. Copy application code
COPY . .

2. Enable FFI (critical)
rm -f /usr/local/etc/php/conf.d/ffi.ini
echo 'ffi.enable=true' > /usr/local/etc/php/conf.d/zz-ffi.ini

3. Verify FFI is active
php -m | grep -qi '^ffi$'

4. Install Composer

Latest Composer downloaded & installed globally.

5. Build Rust token-calculation library (if exists)
cd tokencalculation && cargo build --release

6. Fix file ownership

Backend runs as www-data.

7. CI-only patch (pg_last_error)

Prevents warnings during CI when DB not connected yet.

Before:

pg_last_error()


Patched:

if ($conn) {
   pg_last_error();
} else {
   error_log("Connection not established before pg_last_error().");
}

Why?

In CI, backend starts before migrations finish → this avoids noisy warnings.

8. Prepare logs directory
runtime-data/logs/errorlog.txt
runtime-data/logs/graphql_debug.log
chmod 666

Why?

NGINX writes access logs
PHP writes application logs
Everything must be writable inside container & by host bind mounts in local dev.

9. Install php-ffmpeg

Without system ffmpeg, PHP would error.
This library wraps FFmpeg bindings.

10. Composer install (production)
composer install --no-dev --prefer-dist

11. PHP configuration (prod tuned)

Errors logged only

No display errors

Upload limits increased (up to 510 MB)

12. Copy NGINX & Supervisor configs
COPY docker/nginx/default.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisord.conf

13. Key generation (runtime)

Handled by docker-compose CMD:

If keys are missing:

openssl genpkey -algorithm RSA -out keys/private.key
openssl rsa -pubout -in keys/private.key -out keys/public.key


Same for refresh tokens.

Why?

Ensures production/staging always have cryptographic JWT keys.

14. Entrypoint: Supervisor

Supervisor manages:

program:php-fpm

program:nginx

Both run inside one container.

#️⃣ 3. Dockerfile.local – Local Development Build

Dockerfile.local matches production but optimized for developers:

Differences:

✔ Build includes:

- Local bind mounts (src/, runtime-data/)
- Less caching
- No CI patches
- Simpler composer workflow (runs on host machine before container)
- Much more permissive file permissions (777/666)
- Supervisor autostart
- FFI kept enabled
- Logs are writable from host

✔ Used by:

- docker-compose.override.local.yml
- Makefile: make dev, make reload-backend, make restart-db

✔ Rust library also built if present.

✔ Key differences vs production:

- Composer install happens on host (faster)
- No artifact-copying in container
- No optimization flags for production
- Live code reload via bind mounts (no rebuild required)

#️⃣ 4. Dockerfile.newman – Postman API Test Runner

Used only for:

- Backend CI GitHub Actions
- make test
- make ci
- make ci2

Features:

- Based on postman/newman:alpine
- Installs newman-reporter-htmlextra
- Copies Postman collections and merge script

- Runs tests with:
merged collections
htmlextra HTML reports
environment injection from CI

Why separate?

Backend logs & PHP environment should not interfere with Newman test runner.

Isolation ensures:

- Clean environment
- Repeatable results
- Consistent HTMLExtra report generation

#️⃣ 5. NGINX + PHP-FPM + Supervisor Architecture
Why this architecture?

NGINX
→ Handles HTTP, static files, buffering, request size limits
→ Lightweight, ideal for PHP

PHP-FPM
→ Runs PHP worker processes
→ Efficient and separate from web server
→ Required for SlimPHP framework

Supervisor
→ Manages both processes inside one container
→ Keeps them alive
→ Ensures clean logs
→ Avoids PHP-FPM daemonizing itself

Why not split containers?

Backend is tightly coupled:

- NGINX forwards to local FPM socket
- FastCGI param paths rely on same filesystem
- Simpler for local dev and CI
- Microservices not required here.

#️⃣ 6. Log Structure

All logs live in:

runtime-data/logs

Contains:
File	            Purpose
graphql_debug.log	GraphQL access/debug logs
errorlog.txt	    PHP errors
NGINX logs	        written to container stdout → GitHub Actions collects logs

Permissions:

```bash
chmod 666 *.log
```

Required so:

- NGINX can write
- PHP-FPM can write
- Docker bind mounts don't block writes

#️⃣ 7. FFI – Why It’s Required

The Peer Backend uses a Rust library for token calculations.

FFI allows PHP to:

- load the Rust .so library
- call Rust functions directly from PHP

Without FFI enabled:

❌ Token calculation fails
❌ Backend cannot generate rewards
❌ CI and production would break

#️⃣ 8. runtime-data/logs Behavior
CI Mode:

- Container logs copied to artifacts
- GitHub Actions displays real-time logs
- Runtime logs saved for debugging of failed Newman tests

Local Mode:

- Logs bind-mounted from host machine
- Hot reload of SlimPHP debugging

Developer can tail logs via:

```bash
make logs
```

#️⃣ 9. Key Generation (JWT)

On container startup:

If keys are missing, the backend:

- generates RSA private key
- generates RSA public key
- generates refresh token keys
- sets permissions to 644

Works for:

- Local dev
- CI environment
- Production (first boot only)

#️⃣ 10. pg_last_error CI Patch (Security + Stability)

In CI, backend may start faster than Postgres.

pg_last_error() is normally called without open connection → logs warnings.

The patch avoids noise:

Before:

pg_last_error()


After:

if ($conn) { pg_last_error(); }
else { error_log("Connection not established..."); }


This prevents CI log pollution and makes debugging real errors easier.

#️⃣ 11. Security Considerations
✔ No secrets in the image

All secrets come from:

- .env in docker-compose
- GitHub Actions repository secrets
- No secrets baked into Dockerfile

✔ Private keys not tracked

.gitignore excludes:

- keys/*.key
- runtime-data/media/*
- runtime-data/logs/*

✔ Gitleaks prevents committing secrets

Both:

- Pre-commit hook
- CI detection
- Local make scan

✔ Composer installed inside container

No host dependencies leak into production.

✔ Rust binaries built inside container

Ensures deterministic builds.

✔ Supervisor prevents orphaned processes

Prevents php-fpm zombie workers (DoS risk).

✔ NGINX limits request size

client_max_body_size 80M protects against huge payload attacks.