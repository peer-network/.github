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

function computeHealth(info) {
    let score = 100;
    const penalties = [];

    if (info.openPRs > 8) {
        score -= 10;
        penalties.push(`-10: Too many open PRs (${info.openPRs})`);
    }

    if (info.failures > 5) {
        score -= 20;
        penalties.push(`-20: CI failures (${info.failures})`);
    }

    if (!info.gitleaks) {
        score -= 15;
        penalties.push(`-15: No successful Gitleaks run`);
    }

    if (!info.trivy) {
        score -= 15;
        penalties.push(`-15: No successful Trivy run`);
    }

    if (!info.lastCI) {
        score -= 10;
        penalties.push(`-10: No CI run detected`);
    } else {
        const ciAge = (Date.now() - new Date(info.lastCI)) / 36e5;
        if (ciAge > 24) {
            score -= 10;
            penalties.push(`-10: CI run older than 24h (${Math.round(ciAge)}h)`);
        }
    }

    return { score: Math.max(0, score), penalties };
}

async function fetchJSON(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch {
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
    const repoInfos = [];

    const tableBody = document.querySelector("#repo-table tbody");

    for (const repo of repos) {
        const info = {
            repo,
            openPRs: 0,
            failures: 0,
            gitleaks: null,
            trivy: null,
            lastCI: null,
        };

        const prs = await fetchJSON(gh(`https://api.github.com/repos/${repo}/pulls?state=open`));
        if (prs) {
            info.openPRs = prs.length;
            totalOpenPRs += prs.length;
        }

        const runs = await fetchJSON(gh(`https://api.github.com/repos/${repo}/actions/runs?per_page=20`));
        if (runs?.workflow_runs) {
            const wr = runs.workflow_runs;

            info.failures = wr.filter(r => r.conclusion === "failure").length;
            totalFailures += info.failures;

            if (wr.length > 0) info.lastCI = wr[0].created_at;

            for (const run of wr) {
                if (!info.gitleaks) info.gitleaks = await findJob(repo, run.id, "gitleaks");
                if (!info.trivy) info.trivy = await findJob(repo, run.id, "trivy");
                if (info.gitleaks && info.trivy) break;
            }
        }

        const { score, penalties } = computeHealth(info);
        info.score = score;
        info.penalties = penalties;

        repoInfos.push(info);
    }

    // Build table
    let rows = "";
    for (const info of repoInfos) {
        const color = info.score > 75 ? "green" : info.score > 50 ? "yellow" : "red";
        const id = info.repo.replace("/", "-");

        rows += `
            <tr>
                <td><a href="https://github.com/${info.repo}" target="_blank">${info.repo}</a></td>
                <td>${info.openPRs}</td>
                <td>${info.gitleaks ? new Date(info.gitleaks).toLocaleString() : badge("red","None")}</td>
                <td>${info.trivy ? new Date(info.trivy).toLocaleString() : badge("red","None")}</td>
                <td>${info.lastCI ? new Date(info.lastCI).toLocaleString() : "—"}</td>
                <td>
                    ${badge(color, info.score)}
                    <div><button class="details-btn" data-target="${id}">Details ▼</button></div>
                </td>
                <td><a href="https://github.com/${info.repo}/actions" target="_blank">🔗 View Actions</a></td>
            </tr>

            <tr class="details-row" id="details-${id}" style="display:none;">
                <td colspan="7">
                    <div class="details-content">
                        ${
                            info.penalties.length
                                ? info.penalties.map(p => `<div>${p}</div>`).join("")
                                : "No penalties — full 100 score 🎉"
                        }
                    </div>
                </td>
            </tr>
        `;
    }

    tableBody.innerHTML = rows;

    // Per-repo toggle
    document.querySelectorAll(".details-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const row = document.querySelector(`#details-${btn.dataset.target}`);
            const isHidden = row.style.display === "none";
            row.style.display = isHidden ? "table-row" : "none";
            btn.textContent = isHidden ? "Hide ▲" : "Details ▼";
        });
    });

    // ORG SCORE
    const avg = Math.round(repoInfos.reduce((a,b)=>a + b.score, 0) / repoInfos.length);
    const color = avg > 75 ? "green" : avg > 50 ? "yellow" : "red";
    document.querySelector("#health-score").innerHTML = badge(color, avg);

    // ORG DETAILS (O1)
    const orgDetails = repoInfos
        .map(info => {
            const lost = 100 - info.score;
            return lost === 0
                ? `<div>✔️ ${info.repo}: no penalties</div>`
                : `<div>• ${info.repo}: -${lost} points</div>`;
        })
        .join("") +
        `<hr><strong>Overall Avg = ${avg}</strong>`;

    document.querySelector("#org-details").innerHTML = orgDetails;

    document.querySelector("#org-details-btn").addEventListener("click", () => {
        const box = document.querySelector("#org-details");
        const isHidden = box.style.display === "none";
        box.style.display = isHidden ? "block" : "none";
        document.querySelector("#org-details-btn").textContent =
            isHidden ? "Hide ▲" : "Details ▼";
    });

    document.querySelector("#open-prs").innerText = totalOpenPRs;
    document.querySelector("#ci-failures").innerText = totalFailures;

    document.getElementById("loading").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
}

loadDashboard();
