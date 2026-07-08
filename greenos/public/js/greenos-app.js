const API = "/api/v1";
let token = localStorage.getItem("greenos_token");

function consumeTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (!urlToken) return;
    token = urlToken;
    localStorage.setItem("greenos_token", urlToken);
    window.history.replaceState({}, document.title, window.location.pathname);
}
consumeTokenFromUrl();

const $ = (sel) => document.querySelector(sel);

async function apiFetch(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

function showLogin() {
    $("#login-screen").classList.remove("hidden");
    $("#app-screen").classList.add("hidden");
}

function showApp(user) {
    $("#login-screen").classList.add("hidden");
    $("#app-screen").classList.remove("hidden");
    $("#logged-user").textContent = `${user.firstName} ${user.lastName} (${user.role})`;
}

$("#login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#login-error");
    err.classList.add("hidden");
    try {
        const res = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username: $("#username").value.trim(),
                password: $("#password").value,
            }),
        });
        token = res.data.token;
        localStorage.setItem("greenos_token", token);
        showApp(res.data.user);
        await loadModules();
    } catch (ex) {
        err.textContent = ex.message || "Login failed";
        err.classList.remove("hidden");
    }
});

$("#logout-btn")?.addEventListener("click", () => {
    token = null;
    localStorage.removeItem("greenos_token");
    showLogin();
});

$("#back-hub")?.addEventListener("click", () => {
    $("#hub-view").classList.remove("hidden");
    $("#module-view").classList.add("hidden");
});

async function loadModules() {
    const grid = $("#modules-grid");
    const data = await apiFetch("/platform/modules");
    grid.innerHTML = data.data.map((m) => `
        <article class="module-card ${m.enabled ? "" : "disabled"}" data-key="${m.moduleKey}" data-enabled="${m.enabled}">
            <h3>${m.displayName}</h3>
            <p>${m.description || ""}</p>
            <span class="badge ${m.enabled ? "live" : ""}">${m.enabled ? "Available" : "Coming soon"}</span>
        </article>
    `).join("");

    grid.querySelectorAll(".module-card").forEach((card) => {
        card.addEventListener("click", () => {
            if (card.dataset.enabled !== "true") return;
            openModule(card.dataset.key);
        });
    });
}

async function openModule(key) {
    $("#hub-view").classList.add("hidden");
    $("#module-view").classList.remove("hidden");
    const content = $("#module-content");

    if (key === "attendance") {
        content.innerHTML = "<h2>Attendance</h2><p>Loading dashboard…</p>";
        const dash = await apiFetch("/dashboard");
        const rows = dash.data.rows || [];
        content.innerHTML = `
            <h2>Attendance — ${dash.data.workDate}</h2>
            <p>Inside office: <strong>${dash.data.stats.insideOffice}</strong> · Total: ${dash.data.stats.totalEmployees}</p>
            <table>
                <thead><tr><th>Employee</th><th>Department</th><th>Status</th><th>First entry</th></tr></thead>
                <tbody>
                    ${rows.map((r) => `
                        <tr>
                            <td>${r.employeeName}</td>
                            <td>${r.department || "—"}</td>
                            <td>${r.currentStatus}</td>
                            <td>${r.firstEntry ? new Date(r.firstEntry).toLocaleString() : "—"}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
        return;
    }

    content.innerHTML = `<h2>${key}</h2><p>Module coming soon.</p>`;
}

async function init() {
    if (!token) {
        showLogin();
        return;
    }
    try {
        const me = await apiFetch("/auth/me");
        showApp(me.data);
        await loadModules();
    } catch {
        showLogin();
    }
}

init();
