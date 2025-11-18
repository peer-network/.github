🔐 Reusable Workflow: Gitleaks Secret Scanning
📌 Overview

The Gitleaks reusable workflow provides organization-wide secret scanning for all Peer Network repositories.
It prevents API keys, passwords, tokens, connection strings, and other sensitive data from being committed or merged into the codebase.
his workflow is maintained centrally in the peer_global_security repository and can be imported by any Peer Network repository.

📍 Workflow Location
peer_global_security/.github/workflows/gitleaks.yml

🎯 Purpose
- Enforce consistent secret scanning across all repos
- Provide both diff-based scanning and full repo scanning
- Upload reports for inspection
- Block PRs that contain leaked secrets
- Allow repo-specific configuration via gitleaks.toml

⚙ How the Workflow Works
1. Event Detection

The workflow behaves differently depending on the GitHub event.

Event Type:
pull_request
push
No valid base ref

Scan Mode:
for pull_request ,  Diff Scan (Base Branch → HEAD)
for push , Diff Scan (HEAD^ → HEAD)
for No valid base ref , Full Repository Scan

Description:
for pull_request , Scans only changed lines between the base branch and PR branch
for push , Scans only the latest commit
for No valid base ref , Fallback mode for cases where diffing is not possible


2. Scanning Logic Flow

- Check out the repository

- Detect base branch reference

- Determine appropriate scan target:

PR diff

push diff

full repo

- Run Gitleaks v8.28.0 inside Docker:

ghcr.io/gitleaks/gitleaks:v8.28.0 detect


- Save scan results to:

.gitleaks_out/gitleaks-report.json


Upload the report as an artifact

Fail the job if any "RuleID" is found in the report

3. Optional Config Input

- Repos can provide a custom config using:

with:
  config: "gitleaks.toml"

- Default:

gitleaks.toml


- This allows teams to:

ignore false positives

add custom allowlists

customize detection rules


🧩 How to Use This Workflow in Any Repo

Add this to your repository’s workflow:

jobs:
  gitleaks_scan:
    uses: peer-network/peer_global_security/.github/workflows/gitleaks.yml@main
    with:
      config: "gitleaks.toml"


- This will:

run secret scanning on PRs and pushes

generate a detection report

block the PR if secrets are found


📤 Outputs & Artifacts
Artifact: Gitleaks Report
After each run, the workflow uploads:

"gitleaks-report.json"

- You can download it from:

Actions → Workflow Run → Artifacts
Discord notifications (backend/frontend repos)

Failure Conditions

- CI will fail when:

"RuleID": "..."


is present in the report.

Developers must then:

Open .gitleaks_out/gitleaks-report.json

Inspect detected secrets

Remove or mask the secret

Commit again

If it's false positive, the Team Lead / CTO / DevOps must approve adding it to the allowlist in gitleaks.toml.

🔒 Security Model

- PRs cannot be merged if secrets are detected
- Developers cannot bypass this using --no-verify
- Secret scanning happens both:
   locally (pre-commit hook)
    in CI (reusable workflow)
- This dual-layer protection ensures high security.


🧠 Why This Workflow Matters
- Ensures uniform security across all codebases
- Catches leaks early and prevents production exposure
- Reduces risks related to API key leaks
- Centralizes rule configuration
- Makes the PR process safer and more reliable

🏁 Summary
This reusable Gitleaks workflow is one of the core security components of Peer Network’s DevOps ecosystem.
By centralizing the logic in the peer_global_security repo, every team gains consistent, automatic, and strict protection against secret leaks.