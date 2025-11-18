🔐 Gitleaks Pre-Commit Hook (Local Developer Secret Scanning)
📌 Overview

The Gitleaks pre-commit hook provides local security scanning before developers push code to GitHub.

This prevents secrets (API keys, tokens, passwords, keys, credentials) from ever entering the repository history, long before CI detects them.

It is the first layer of the dual secret-protection system:

Layer	                  Location	             Purpose
Local Pre-Commit Hook	.githooks/pre-commit  Prevent secrets from being committed
CI Gitleaks Scan	    Reusable workflow	   Block PRs that contain secrets

Developers get instant feedback locally.
CI then enforces security remotely.


📍 Files Involved

- These files live inside each repo that uses local scanning:

.githooks/pre-commit
setup-hooks.sh
gitleaks.toml
.gitleaks_out/  (gitignored)

- Main Components
pre-commit hook → runs secret scan on staged changes
setup-hooks.sh → installs the hook + installs Gitleaks binary
gitleaks.toml → config with allowlists, false-positive rules
.gitleaks_out/ → local scan reports (ignored in Git)

🎯 Purpose of the Pre-Commit System

- The pre-commit system:
scans only the staged changes
stops the commit if secrets are detected
warns developers NOT to bypass using --no-verify
uses local Gitleaks binary if installed
falls back to Docker otherwise
writes detailed reports to .gitleaks_out/gitleaks-precommit.json
This dramatically reduces the chance of secrets ever reaching GitHub.

⚙️ How the Pre-Commit Hook Works
1. Runs on Staged Changes Only

The hook scans only the lines being added:

git diff --cached --unified=0 --no-color \
  | grep '^+' \
  | grep -v '^+++' \
  | sh -c "$SCAN_CMD"


- This means:
fast performance
minimal output
no full repository scanning

2. Local Binary Preferred

If Gitleaks is installed locally:

gitleaks detect --pipe ...

3. Docker Fallback

If Gitleaks is not installed:

docker run --rm ghcr.io/gitleaks/gitleaks:v8.28.0 detect ...


- This guarantees:
the hook works on ANY machine
consistent Gitleaks version (v8.28.0)
zero developer configuration required

4. Report Saved to Disk

Output saved to:

.gitleaks_out/gitleaks-precommit.json


- This folder is:
gitignored
purely local
useful for debugging

5. Commit Blocking Logic

If secrets are detected:

echo "Commit aborted."
exit 1


- A full warning is printed advising developers:
NOT to use --no-verify
CI will still block PRs
False positives must be reviewed by Team Lead /CTO/ DevOps


🚀 Setup Instructions for Developers

- Each developer must run:

```bash
chmod +x setup-hooks.sh
./setup-hooks.sh
```

- This script:
1. Configures Git to use .githooks/:
git config core.hooksPath .githooks


2. Makes the hook executable:
chmod +x .githooks/pre-commit


3. Installs Gitleaks locally (if missing):
Detects OS + CPU architecture
Downloads correct binary
Installs to /usr/local/bin

4. Verifies installation:
gitleaks version


🔍 Developer Experience & Workflow
- Commit Allowed (No Secrets Found)
No secrets found. Commit allowed.

- Commit Blocked
If the hook finds possible secrets:

Possible secrets detected in staged changes!
Commit aborted.


- Developer must:
Open .gitleaks_out/gitleaks-precommit.json
Fix the sensitive value
Commit again

- If false positive:
Dev must contact Team Lead /CTO/ DevOps
Exception can be added to gitleaks.toml


🗂 Folder: .gitleaks_out/

- This folder is for
local precommit reports
debugging results
isolated from repo (gitignored)
It is safe and intentional to ignore this folder.


⚠️ Important: Do NOT Bypass the Hook

- The hook prints a strong warning:

"Do NOT bypass with 'git commit --no-verify'
CI will still block your PR."


- Meaning:
bypassing does NOT help
CI Gitleaks will fail
developers must fix the leak
This ensures strong security enforcement.

💡 Why Pre-Commit + CI Combo is Powerful
Layer	Benefits
Pre-Commit	Catches secrets instantly, before they ever leave local machine
CI Workflow	Enforces security at organizational level, prevents merges

- This dual system is used in:
Google
GitHub
Shopify
Uber
Stripe

And now in Peer Network. 😊

🏁 Summary

The Gitleaks pre-commit hook provides proactive local secret scanning.
It prevents developers from accidentally committing sensitive values and complements the CI-level Gitleaks workflow.

Together, they form a strong, two-layer security shield:

Local scan: stops secrets before committing

CI scan: enforces security across the organization

This significantly reduces secret leakage risk while keeping development simple and automatic.