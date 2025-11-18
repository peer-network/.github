🛡 Reusable Workflow: Trivy Security Scan
📌 Overview

The Trivy reusable workflow provides a unified security scanning layer across all Peer Network repositories.
It detects HIGH and CRITICAL vulnerabilities in:

OS packages

Shared libraries

Dependency files

Application source structure

This workflow ensures that every repo passes a minimal security baseline before merging.

📍 Workflow Location
.github/.github/workflows/trivy-scan.yml


This reusable workflow is maintained centrally in the organizational .github repo, which is automatically shared and inherited across all Peer Network development repositories.

🎯 Purpose

- The Trivy reusable workflow:

Performs a filesystem vulnerability scan

Detects HIGH and CRITICAL vulnerabilities

Runs in soft mode (does NOT fail CI), but sends a notification to devs to avoid breaking developer flow

Uploads a report so developers can investigate issues

Outputs whether vulnerabilities were found

Can be expanded later into automated policies.

- This workflow helps maintain security visibility without blocking development.

⚙ How the Workflow Works

The workflow runs in 4 stages:

1. Checkout Source
- name: Checkout Source
  uses: actions/checkout@v5

This ensures Trivy scans the correct filesystem state.

2. Run Trivy Filesystem Scan
- name: Run Trivy Filesystem Scan
  uses: aquasecurity/trivy-action@0.20.0

Important settings:

Setting	             Value	         Meaning
scan-type	         fs	              Filesystem scan mode
scan-ref	        user input	      Defaults to whole repo
ignore-unfixed	    true	          Reduces noise
severity	       HIGH,CRITICAL	  Only important vulnerabilities
exit-code	           0	          Soft mode (does NOT fail CI)
format	             table	          Easy to read
output	          trivy-report.txt	  Output file


3. Detect if Findings Exist
"if grep -q "CRITICAL" trivy-report.txt || grep -q "HIGH" trivy-report.txt; then"

Outputs:

"has_findings=true/false"

This allows other CI steps (e.g., Discord notifications) to react dynamically.

4. Upload Report Artifact
uses: actions/upload-artifact@v5
with:
  name: trivy-scan-report
  path: trivy-report.txt

Developers can download this artifact to see the full vulnerability list.

🧩 How to Use This Workflow in Any Repo

Add this to your CI workflow:

jobs:
  trivy_scan:
    uses: peer-network/.github/.github/workflows/trivy-scan.yml@main
    with:
      scan_target: "."

Optional: Scan a subdirectory

Example:

with:
  scan_target: "./src"

📤 Outputs & Artifacts
Artifact: Trivy Report

Generated on every run:

trivy-report.txt


- Developers download it from:
Actions → Workflow Run → Artifacts
Discord notifications (if integrated)

- Output Variable
"has_findings = true/false"


Meaning:

Value	  Explanation
true	  HIGH or CRITICAL vulnerability detected
false	  No severe vulnerabilities found

- This output is used by:
  notification jobs
  final CI decision jobs
  summary pipelines

❗ Failure Behavior

- The workflow does not fail CI automatically because:

CTO prefers “soft mode” for other repos., it only notifies devs for awareness. but it is strict and fail workflow on peer-backend repo

Trivy results can be noisy

Frontend, Android, Rust, and Backend all trigger Trivy

It helps teams gradually improve without blocking development

Failures may happen only if a repo specifically enforces it in final decision jobs (example: backend).

🧠 Why Trivy is Useful

- Provides visibility into dependency vulnerabilities
- Ensures every repo meets a minimal security standard
- Allows team leads to monitor security health
- Integrates into dashboards
- Standardized across the entire organization
- This workflow is a foundational part of Peer Network’s security posture.

🏁 Summary

The Trivy reusable workflow ensures consistent, organization-wide security scanning without blocking development.
It provides a predictable output format, easy developer reports, and a standard way to identify HIGH/CRITICAL vulnerabilities across all codebases.

Because it is managed in the central .github repo, any improvements automatically propagate to every repo in the organization.