function badge(color, text) {
    return `<span class="badge ${color}">${text}</span>`;
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

async function loadDashboard() {
    document.getElementById("loading").style.display = "block";

    const repos = [
        "peer-network/peer_backend",
        "peer-network/peer_web_frontend",
        "peer-network/peer_android_frontend",
        "peer-network/peer_ios_frontend",
        "peer-network/peer_rust_backend",
        "peer-network/peer_cd",
        "peer-network/peer_ansible",
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
        const prs = await fetchJSON(`https://api.github.com/repos/${repo}/pulls?state=open`);
        if (prs) {
            info.openPRs = prs.length;
            totalOpenPRs += prs.length;
        }

        // --- CI RUNS ---
        const runs = await fetchJSON(`https://api.github.com/repos/${repo}/actions/runs?per_page=30`);
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

            // gitleaks
            const gRun = workflowRuns.find(r =>
                r.name?.toLowerCase().includes("gitleaks") ||
                r.display_title?.toLowerCase().includes("gitleaks")
            );
            info.gitleaks = gRun?.created_at || null;

            // trivy
            const tRun = workflowRuns.find(r =>
                r.name?.toLowerCase().includes("trivy") ||
                r.display_title?.toLowerCase().includes("trivy")
            );
            info.trivy = tRun?.created_at || null;

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
                <td>${repo}</td>
                <td>${info.openPRs}</td>
                <td>${info.gitleaks ? new Date(info.gitleaks).toLocaleString() : badge("red","None")}</td>
                <td>${info.trivy ? new Date(info.trivy).toLocaleString() : badge("red","None")}</td>
                <td>${info.lastCI ? new Date(info.lastCI).toLocaleString() : "—"}</td>
                <td>${badge(color, score)}</td>
            </tr>
        `;
    }


    // Update dashboard
    document.getElementById("open-prs").innerText = totalOpenPRs;
    document.getElementById("ci-failures").innerText = totalFailures;

    // Placeholder values
    document.getElementById("gitleaks-run").innerText =
        lastGitleaksDate ? lastGitleaksDate.toLocaleString() : "No runs found";

    document.getElementById("trivy-run").innerText =
        lastTrivyDate ? lastTrivyDate.toLocaleString() : "No runs found";
    document.getElementById("health-score").innerText = Math.round(totalFailures === 0 ? 90 : 70);

    // Show UI
    document.getElementById("loading").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
}

loadDashboard();