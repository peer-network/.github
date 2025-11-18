🔁 Repo CI Flow Pattern (Standardized CI Structure)
📌 Overview

- Every Peer Network repository follows the same high-level CI pattern:
Branch Sync Check
PR → Discord Mapping
Security Scans (Gitleaks & Trivy)
Project-Specific Tests (Backend | Web | Android | Rust)
Unified Discord Notification
Final Merge-Gate Check
- This standardization ensures:
Consistency
Predictability
Developer clarity
Security enforcement
Unified notifications
Scalable DevOps patterns
This is the recommended structure for all repos.

1️⃣ Branch Sync Check

Ensures developers do not run CI on outdated branches.

- Purpose
Prevent merge conflicts
Ensure PR runs with the latest base branch state
Enforce good Git hygiene

- Logic
. The workflow compares:
origin/base_branch  ←→  origin/pr_branch


. If the PR branch is behind:
is_behind=true


. Then the CI:
stops
sends a Discord warning
blocks the PR until the branch is updated

- Why this is important
Avoids merge surprises
Ensures all tests run on current code
Prevents wasted CI minutes

2️⃣ Map PR Author to Discord User
- Purpose
To ensure CI notifications tag the correct developer directly.

- How it works
A small job maps GitHub usernames to Discord IDs:

Example:

case "${{ github.event.pull_request.user.login }}" in
  WisdomNwaiwu) <@1362087975906967736> ;;
  jakobPeer) <@1334087880833892392> ;;
  LuqmanUddin0007) <@1367037547011641407> ;;
esac

- Output
discord_mention="<@ID>"

This is used later in notifications.

3️⃣ Security Layer (Reusable Workflows)

- This layer contains two organization-wide reusable workflows:
A. Gitleaks (Reusable)

Runs secret scanning via:

"peer-network/peer_global_security/.github/workflows/gitleaks.yml"


- Detects secrets
- Runs diff-based or full scan
- Uploads artifact
- CI fails on secret detection

B. Trivy (Reusable)

Runs vulnerability scanning via:

"peer-network/.github/.github/workflows/trivy-scan.yml"

- Detects HIGH/CRITICAL vulnerabilities
- Soft mode (does not break CI automatically)
- Uploads artifact
- Output indicates findings

Why this layer exists

- Mandatory for all repos
- Standardized security baseline
- Easy to expand into future dashboards

4️⃣ Repo-Specific Test Jobs

Each repo may add its own tests, after the security layer: eg;

- Backend

PHPStan
PHPUnit 
Newman API tests
SQL validation

- Web Frontend
ESLint
Build tests
Playwright

- Android
Android Lint
Unit tests

- Rust Backend
Cargo clippy
Cargo test

- These jobs run after:
branch sync
gitleaks
trivy

Because security checks are organization-wide.

5️⃣ Unified Discord Notification (Smart Handler)
Purpose

Every repo should send a single Discord summary after CI finishes — regardless of success or failure.

The notification system:

- waits for all previous jobs
- collects their output
- determines the correct message type
- sends one clean JSON payload to Discord

Possible status types
Status	                   Meaning
behind	                   PR branch is outdated
gitleaks_failed	           secrets detected
trivy_vulnerabilities	   HIGH/CRITICAL vulnerabilities found
success	                   all critical checks passed

Uses

- PR title
- PR URL
- GitHub author
- Mapped Discord mention
- CI run URL

Developers get clean, actionable notifications.


6️⃣ Final Check (Merge Gate)

This job makes the final decision:

A PR should be blocked automatically if:

- Condition	Result
- Branch behind base	❌ CI fails
- Gitleaks failure	❌ CI fails
- Trivy finding?	ℹ Depends on repo policy (usually soft mode)
- All critical checks pass	✅ CI success

The final step enforces:

- security
- consistency
- clean git workflow
- proper team process

This ensures no PR bypasses the rules.

🧭 Full Flow Summary
📌 Standardized CI Flow for All Repos
1. Branch Sync Check
     ↓
2. Map PR Author to Discord
     ↓
3. Security Scans (Reusable Gitleaks + Reusable Trivy)
     ↓
4. Repo-Specific Tests
     ↓
5. Unified Discord Notification
     ↓
6. Final Merge Gate (Fail if necessary)


This creates a strong, scalable CI pipeline for the entire company.


🧠 Why This Pattern Is Important
✔ Predictability

Developers know what happens on every PR.

✔ Scalability

Same pattern works for backend, frontend, mobile, and Rust.

✔ Security

Mandatory scanning everywhere.

✔ DevOps Maintainability

Changes to reusable workflows automatically propagate org-wide.

✔ Developer Experience

Clean notifications and easy debugging.

✔ Strong Merge Gates

No outdated branches
No secret leaks
No silent vulnerabilities


🏁 Conclusion

The Repo CI Flow Pattern is the core CI architecture of Peer Network.
It enforces:

- Git hygiene
- Security
- Consistency
- Developer visibility
- Scalability

This pattern will be referenced in your:

✔ DevOps Documentation Portal
✔ CI Architecture Overview
✔ Onboarding Guide
✔ Reusable Workflow Library