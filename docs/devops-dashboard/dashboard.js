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
        "peer-network/peer_rust_backend",
        "peer-network/peer_cd",
        "peer-network/.github",
    ];

    let totalOpenPRs = 0;
    let totalFailures = 0;

    for (const repo of repos) {
        console.log("Fetching repo:", repo);

        // --- OPEN PRs ---
        const prs = await fetchJSON(`https://api.github.com/repos/${repo}/pulls?state=open`);
        if (prs) totalOpenPRs += prs.length;

        // --- FAILED CI RUNS ---
        const runs = await fetchJSON(`https://api.github.com/repos/${repo}/actions/runs?per_page=50`);
        if (runs?.workflow_runs) {
            const failed = runs.workflow_runs.filter(r => r.conclusion === "failure").length;
            totalFailures += failed;
        }
    }

    // Update dashboard
    document.getElementById("open-prs").innerText = totalOpenPRs;
    document.getElementById("ci-failures").innerText = totalFailures;

    // Placeholder values
    document.getElementById("gitleaks-run").innerText = "Coming soon...";
    document.getElementById("trivy-run").innerText = "Coming soon...";
    document.getElementById("health-score").innerText = "Calculating...";

    // Show UI
    document.getElementById("loading").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
}

loadDashboard();
