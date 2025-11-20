const PROXY = "https://peer-devops-proxy.wisdom-nwaiwu-peer-b40.workers.dev";

function gh(url) {
    return `${PROXY}?url=${encodeURIComponent(url)}`;
}

function badge(color, text) {
    const icon =
        color === "green" ? "🟩" :
        color === "yellow" ? "🟨" :
        "🟥";

    return `<span class="badge ${color}">${icon} ${text}</span>`;
}

function computeHealth({ openPRs, failures, gitleaks, trivy, lastCI }) {
    let score = 100;

    if (openPRs > 8) score -= 10;
    if (failures > 5) score -= 20;
    if (!gitleaks) score -= 15;
    if (!trivy) score -= 15;

    if (!lastCI) score -= 10;

    const ciAgeHours = (Date.now() - new Date(lastCI)) / 36e5;
    if (ciAgeHours > 24) score -= 10;

    return Math.max(score, 0);
}

async function fetchJSON(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn("API Error:", url, res.status);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error("Fetch failed:", url, err);
        return null;
    }
}

async function findJob(repo, runId, keyword) {
    const jobs = await fetchJSON(
        gh(`https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs`)
    );
    if (!jobs?.jobs) return null;

    const job = jobs.jobs.find(j =>
        JSON.stringify(j).toLowerCase().includes(keyword)
    );

    return job ? job.started_at : null;
}

async function loadDashboard() {
    document.getElementById("loading").style.display = "block";

    const repos = [
        "peer-network/peer_backend",
        "peer-network/peer_web_frontend",
        "peer-network/peer_android_frontend",
        "peer-network/peer_ios_frontend",
        "peer-network/peer_rust_backend",
        "peer-network/peer_cd",
        "peer-network/peer-ansible",
        "peer-network/.github",
    ];

    let totalOpenPRs = 0;
    let totalFailures = 0;
    let lastGitleaksDate = null;
    let lastTrivyDate = null;

    const tableBody = document.querySelector("#repo-table tbody");

    for (const repo of repos) {

        // Per-repo object
        const info = {
            repo,
            openPRs: 0,
            failures: 0,
            gitleaks: null,
            trivy: null,
            lastCI: null,
        };

        // --- OPEN PRs ---
        const prs = await fetchJSON(
            gh(`https://api.github.com/repos/${repo}/pulls?state=open`)
        );
        if (prs) {
            info.openPRs = prs.length;
            totalOpenPRs += prs.length;
        }

        // --- CI RUNS ---
        const runs = await fetchJSON(
            gh(`https://api.github.com/repos/${repo}/actions/runs?per_page=30`)
        );
        if (runs?.workflow_runs) {

            const workflowRuns = runs.workflow_runs;

            // failures
            const failed = workflowRuns.filter(r => r.conclusion === "failure").length;
            info.failures = failed;
            totalFailures += failed;

            // last CI
            if (workflowRuns.length > 0) {
                info.lastCI = workflowRuns[0].created_at;
            }

            if (workflowRuns.length > 0) {
                for (const run of workflowRuns) {
                    const runId = run.id;

                    const g = await findJob(repo, runId, "gitleaks");
                    if (g && !info.gitleaks) info.gitleaks = g;

                    const t = await findJob(repo, runId, "trivy");
                    if (t && !info.trivy) info.trivy = t;

                    // Done early if both found
                    if (info.gitleaks && info.trivy) break;
                }
            }

            // --- Track org-wide latest Gitleaks run ---
            if (info.gitleaks) {
                const d = new Date(info.gitleaks);
                if (!lastGitleaksDate || d > lastGitleaksDate) {
                    lastGitleaksDate = d;
                }
            }

            // --- Track org-wide latest Trivy run ---
            if (info.trivy) {
                const d = new Date(info.trivy);
                if (!lastTrivyDate || d > lastTrivyDate) {
                    lastTrivyDate = d;
                }
            }
        }

        // --- Compute repo health ---
        const score = computeHealth(info);
        const color = score > 75 ? "green" : score > 50 ? "yellow" : "red";

        // --- Add row to table ---
        tableBody.innerHTML += `
            <tr>
                <td><a href="https://github.com/${repo}" target="_blank">${repo}</a></td>
                <td>${info.openPRs}</td>
                <td>${info.gitleaks ? new Date(info.gitleaks).toLocaleString() : badge("red","None")}</td>
                <td>${info.trivy ? new Date(info.trivy).toLocaleString() : badge("red","None")}</td>
                <td>${info.lastCI ? new Date(info.lastCI).toLocaleString() : "—"}</td>
                <td>${badge(color, score)}</td>
                <td><a href="https://github.com/${repo}/actions" target="_blank">🔗 View Actions</a></td>
            </tr>
        `;
    }

    // Update dashboard
    document.getElementById("open-prs").innerText = totalOpenPRs;
    document.getElementById("ci-failures").innerText = totalFailures;
    document.getElementById("health-score").innerText = "—"; // placeholder for now

    // Show UI
    document.getElementById("loading").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
}

loadDashboard();