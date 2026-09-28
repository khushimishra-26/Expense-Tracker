/*
 * Budget Tracker - vanilla JavaScript frontend
 *
 * This file intentionally keeps frontend logic simple:
 * - fetch() talks to the FastAPI backend
 * - sessionStorage keeps access/refresh tokens for the current browser tab
 * - DOM manipulation updates the existing dashboard layout
 */

const API_BASE = "";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USERNAME_KEY = "username";
const BUDGET_KEY_PREFIX = "budget_tracker_budget_";

let expenses = [];
let categoryChart = null;
let monthlyChart = null;

// ============================
// Shared helpers
// ============================

function $(id) {
    return document.getElementById(id);
}

function currentAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function currentRefreshToken() {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

function currentUsername() {
    return sessionStorage.getItem(USERNAME_KEY) || "User";
}

function authHeaders() {
    const token = currentAccessToken();

    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
}

function showMessage(message, type = "info", elementId = "global-message") {
    const element = $(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;

    window.clearTimeout(element._messageTimer);
    element._messageTimer = window.setTimeout(() => {
        element.className = "message hidden";
    }, 4800);
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}

function formatDate(value) {
    const date = parseBackendDate(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function parseBackendDate(value) {
    if (!value) return new Date(NaN);

    // SQLite may return a naive datetime even though the SQLAlchemy column
    // is declared timezone-aware. Your Streamlit version treats naive values
    // as UTC, so do the same in the browser.
    const raw = String(value);
    const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)
        ? raw
        : `${raw}Z`;

    return new Date(normalized);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getBudgets() {
    const key = `${BUDGET_KEY_PREFIX}${currentUsername()}`;
    const fallback = {
        daily: 1000,
        monthly: 30000
    };

    try {
        return {
            ...fallback,
            ...JSON.parse(localStorage.getItem(key) || "{}")
        };
    } catch {
        return fallback;
    }
}

function saveBudgets(budgets) {
    const key = `${BUDGET_KEY_PREFIX}${currentUsername()}`;
    localStorage.setItem(key, JSON.stringify(budgets));
}

async function apiFetch(path, options = {}, retry = true) {
    const headers = {
        ...(options.headers || {}),
        ...authHeaders()
    };

    let response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    });

    if (response.status === 401 && retry && currentRefreshToken()) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            response = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    ...authHeaders()
                }
            });
        }
    }

    return response;
}

async function responseJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

async function refreshAccessToken() {
    const refreshToken = currentRefreshToken();

    if (!refreshToken) {
        return false;
    }

    try {
        // Your current FastAPI endpoint declares refresh_token as a plain
        // parameter, so FastAPI receives it from the query string.
        const response = await fetch(
            `/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`,
            { method: "POST" }
        );

        if (!response.ok) {
            clearSession();
            return false;
        }

        const data = await responseJson(response);

        if (!data.access_token) {
            clearSession();
            return false;
        }

        sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        return true;
    } catch {
        clearSession();
        return false;
    }
}

function clearSession() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
}

function requireAuthentication() {
    if (!currentAccessToken()) {
        window.location.href = "/login";
        return false;
    }

    return true;
}

// ============================
// Authentication page
// ============================

function setupAuthPage() {
    if (!$('login-form') || !$('register-form')) return;

    if (currentAccessToken()) {
        window.location.href = "/";
        return;
    }

    document.querySelectorAll("[data-auth-tab]").forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.authTab;

            document.querySelectorAll("[data-auth-tab]").forEach(item => {
                item.classList.toggle("active", item === tab);
            });

            $('login-form').classList.toggle("hidden", target !== "login");
            $('register-form').classList.toggle("hidden", target !== "register");
            $('auth-message').className = "message hidden";
        });
    });

    $('login-form').addEventListener("submit", handleLogin);
    $('register-form').addEventListener("submit", handleRegister);
}

async function handleLogin(event) {
    event.preventDefault();

    const username = $('login-username').value.trim();
    const password = $('login-password').value;

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await responseJson(response);

        if (!response.ok) {
            showMessage(
                data.detail || "Login failed. Please check your credentials.",
                "error",
                "auth-message"
            );
            return;
        }

        sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
        sessionStorage.setItem(USERNAME_KEY, username);

        window.location.href = "/";
    } catch (error) {
        showMessage(
            `Unable to connect to server: ${error.message}`,
            "error",
            "auth-message"
        );
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = $('register-username').value.trim();
    const email = $('register-email').value.trim();
    const password = $('register-password').value;
    const confirm = $('register-confirm').value;

    if (password !== confirm) {
        showMessage("Passwords do not match.", "error", "auth-message");
        return;
    }

    try {
        const response = await fetch("/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await responseJson(response);

        if (!response.ok) {
            showMessage(
                data.detail || "Registration failed.",
                "error",
                "auth-message"
            );
            return;
        }

        $('register-form').reset();
        showMessage(
            "Registration successful. Please log in.",
            "success",
            "auth-message"
        );

        document.querySelector('[data-auth-tab="login"]').click();
        $('login-username').value = username;
    } catch (error) {
        showMessage(
            `Unable to connect to server: ${error.message}`,
            "error",
            "auth-message"
        );
    }
}

// ============================
// Dashboard / navigation
// ============================

function setupDashboard() {
    if (!$('page-dashboard')) return;
    if (!requireAuthentication()) return;

    const username = currentUsername();

    if ($('welcome-user')) $('welcome-user').textContent = `Hi, ${username}`;
    if ($('sidebar-user')) $('sidebar-user').textContent = username;
    if ($('user-avatar')) $('user-avatar').textContent = username.charAt(0).toUpperCase();

    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            showPage(link.dataset.page);
        });
    });

    document.querySelectorAll("[data-page-target]").forEach(button => {
        button.addEventListener("click", () => showPage(button.dataset.pageTarget));
    });

    $('logoutButton').addEventListener("click", handleLogout);
    $('dashboard-add-expense').addEventListener("click", openExpenseModal);
    $('menuButton').addEventListener("click", () => $('sidebar').classList.toggle("open"));

    $('close-modal').addEventListener("click", closeExpenseModal);
    $('quick-expense-form').addEventListener("submit", handleQuickExpense);
    $('expense-form').addEventListener("submit", handleExpenseSubmit);
    $('expense-search').addEventListener("input", renderExpenseTable);
    $('budget-form').addEventListener("submit", handleBudgetSubmit);

    $('quick-expense-modal').addEventListener("click", event => {
        if (event.target === $('quick-expense-modal')) {
            closeExpenseModal();
        }
    });

    loadApplicationData();
    setupBudgetForm();
    setupHashNavigation();
}

function setupHashNavigation() {
    window.addEventListener("hashchange", () => {
        const page = window.location.hash.replace("#", "") || "dashboard";
        showPage(page);
    });

    const initialPage = window.location.hash.replace("#", "") || "dashboard";
    showPage(initialPage);
}

function showPage(page) {
    const allowed = ["dashboard", "budgets", "expenses", "reports"];
    const target = allowed.includes(page) ? page : "dashboard";

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === target);
    });

    const section = $(`page-${target}`);
    if (section) section.classList.add("active");

    if (window.location.hash !== `#${target}`) {
        history.replaceState(null, "", `#${target}`);
    }

    $('sidebar')?.classList.remove("open");

    if (target === "reports") {
        renderReports();
    }

    if (target === "budgets") {
        renderBudgetPage();
    }
}

async function loadApplicationData() {
    try {
        const response = await apiFetch("/expenses/");

        if (response.status === 401) {
            clearSession();
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            const data = await responseJson(response);
            showMessage(data.detail || "Failed to load expenses.", "error");
            return;
        }

        const data = await responseJson(response);
        expenses = Array.isArray(data) ? data : [];

        renderAll();
    } catch (error) {
        showMessage(`Failed to retrieve expenses: ${error.message}`, "error");
    }
}

function renderAll() {
    renderDashboard();
    renderExpenseTable();
    renderReports();
    renderBudgetPage();
}

// ============================
// Dashboard rendering
// ============================

function calculateTotals() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const month = now.getMonth();
    const year = now.getFullYear();

    let total = 0;
    let today = 0;
    let monthly = 0;

    for (const expense of expenses) {
        const amount = Number(expense.amount || 0);
        const date = parseBackendDate(expense.created_at);

        total += amount;

        if (!Number.isNaN(date.getTime())) {
            const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            if (dateStart.getTime() === todayStart.getTime()) {
                today += amount;
            }

            if (date.getFullYear() === year && date.getMonth() === month) {
                monthly += amount;
            }
        }
    }

    return {
        total,
        today,
        monthly,
        count: expenses.length
    };
}

function renderDashboard() {
    const totals = calculateTotals();
    const budgets = getBudgets();
    const remaining = Math.max(Number(budgets.monthly || 0) - totals.total, 0);

    $('total-budget').textContent = formatCurrency(budgets.monthly);
    $('total-expenses').textContent = formatCurrency(totals.total);
    $('remaining-budget').textContent = formatCurrency(remaining);
    $('transaction-count').textContent = String(totals.count);

    renderBudgetProgress(totals);
    renderRecentTransactions();
    renderCategoryChart();
    renderMonthlyChart();
}

function renderRecentTransactions() {
    const body = $('recent-transactions-body');
    const empty = $('recent-empty');

    const sorted = [...expenses].sort((a, b) => {
        return parseBackendDate(b.created_at) - parseBackendDate(a.created_at);
    });

    const recent = sorted.slice(0, 5);
    body.innerHTML = "";

    if (recent.length === 0) {
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    for (const expense of recent) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(formatDate(expense.created_at))}</td>
            <td>${escapeHtml(expense.title)}</td>
            <td>${escapeHtml(expense.category)}</td>
            <td class="amount-cell amount-positive">${formatCurrency(expense.amount)}</td>
        `;
        body.appendChild(row);
    }
}

function renderCategoryChart() {
    const totals = {};

    for (const expense of expenses) {
        const category = expense.category || "Uncategorized";
        totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    }

    const labels = Object.keys(totals);
    const values = labels.map(label => totals[label]);
    const empty = $('category-empty');

    if (labels.length === 0) {
        empty.classList.remove("hidden");
    } else {
        empty.classList.add("hidden");
    }

    if (categoryChart) categoryChart.destroy();

    const ctx = $('categoryChart').getContext("2d");

    categoryChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#38BDF8", "#34D399", "#FBBF24", "#F87171",
                    "#A78BFA", "#F472B6", "#9CA3AF", "#4C75AF"
                ],
                borderColor: "#ffffff",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom"
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            cutout: "58%"
        }
    });
}

function renderMonthlyChart() {
    const totals = {};

    for (const expense of expenses) {
        const date = parseBackendDate(expense.created_at);
        if (Number.isNaN(date.getTime())) continue;

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        totals[key] = (totals[key] || 0) + Number(expense.amount || 0);
    }

    const keys = Object.keys(totals).sort();
    const labels = keys.map(key => {
        const [year, month] = key.split("-").map(Number);
        return new Intl.DateTimeFormat("en-IN", {
            month: "short",
            year: "numeric"
        }).format(new Date(year, month - 1, 1));
    });

    const values = keys.map(key => totals[key]);
    const empty = $('monthly-empty');

    if (keys.length === 0) {
        empty.classList.remove("hidden");
    } else {
        empty.classList.add("hidden");
    }

    if (monthlyChart) monthlyChart.destroy();

    const ctx = $('monthlyChart').getContext("2d");

    monthlyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Spending",
                data: values,
                borderColor: "#38BDF8",
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: "#0284C7"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `Spending: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback(value) {
                            return `₹${Number(value).toLocaleString("en-IN")}`;
                        }
                    }
                }
            }
        }
    });
}

// ============================
// Expense management
// ============================

async function handleExpenseSubmit(event) {
    event.preventDefault();

    const title = $('expense-title').value.trim();
    const amount = Number($('expense-amount').value);
    const category = $('expense-category').value.trim();

    await createExpense(title, amount, category, "expense-form");
}

async function handleQuickExpense(event) {
    event.preventDefault();

    const title = $('quick-title').value.trim();
    const amount = Number($('quick-amount').value);
    const category = $('quick-category').value.trim();

    const success = await createExpense(title, amount, category);

    if (success) {
        $('quick-expense-form').reset();
        closeExpenseModal();
    }
}

async function createExpense(title, amount, category, formId = null) {
    if (!title || !category || !amount || amount <= 0) {
        showMessage("Please fill in all fields with valid data.", "error");
        return false;
    }

    try {
        const response = await apiFetch("/expenses/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, amount, category })
        });

        const data = await responseJson(response);

        if (!response.ok) {
            showMessage(data.detail || "Failed to record expense.", "error");
            return false;
        }

        if (formId) $(formId).reset();

        showMessage("Expense recorded successfully.", "success");
        await loadApplicationData();
        return true;
    } catch (error) {
        showMessage(`Server connection error: ${error.message}`, "error");
        return false;
    }
}

function renderExpenseTable() {
    const body = $('expense-table-body');
    if (!body) return;

    const search = ($('expense-search')?.value || "").trim().toLowerCase();

    const filtered = expenses.filter(expense => {
        const text = `${expense.title || ""} ${expense.category || ""}`.toLowerCase();
        return text.includes(search);
    });

    body.innerHTML = "";

    for (const expense of filtered) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(formatDate(expense.created_at))}</td>
            <td>${escapeHtml(expense.title)}</td>
            <td>${escapeHtml(expense.category)}</td>
            <td class="amount-cell amount-positive">${formatCurrency(expense.amount)}</td>
            <td class="action-cell">
                <button class="delete-button" data-delete-id="${expense.id}">
                    <i class="ri-delete-bin-line"></i> Delete
                </button>
            </td>
        `;
        body.appendChild(row);
    }

    body.querySelectorAll("[data-delete-id]").forEach(button => {
        button.addEventListener("click", () => deleteExpense(Number(button.dataset.deleteId)));
    });

    $('expense-list-count').textContent = `${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
    $('expense-empty').classList.toggle("hidden", filtered.length > 0);
}

async function deleteExpense(id) {
    const expense = expenses.find(item => Number(item.id) === Number(id));

    if (!expense) return;

    const confirmed = window.confirm(
        `Delete "${expense.title}" (${formatCurrency(expense.amount)})?`
    );

    if (!confirmed) return;

    try {
        const response = await apiFetch(`/expenses/${id}`, {
            method: "DELETE"
        });

        const data = await responseJson(response);

        if (!response.ok) {
            showMessage(data.detail || "Failed to delete transaction.", "error");
            return;
        }

        showMessage("Transaction deleted.", "success");
        await loadApplicationData();
    } catch (error) {
        showMessage(`Error connecting to server: ${error.message}`, "error");
    }
}

// ============================
// Budgets
// ============================

function setupBudgetForm() {
    const budgets = getBudgets();

    if ($('daily-budget-input')) {
        $('daily-budget-input').value = budgets.daily;
        $('monthly-budget-input').value = budgets.monthly;
    }
}

function handleBudgetSubmit(event) {
    event.preventDefault();

    const daily = Number($('daily-budget-input').value);
    const monthly = Number($('monthly-budget-input').value);

    if (daily < 0 || monthly < 0) {
        showMessage("Budget values cannot be negative.", "error");
        return;
    }

    saveBudgets({ daily, monthly });
    renderAll();
    showMessage("Budget settings saved.", "success");
}

function renderBudgetProgress(totals = calculateTotals()) {
    const budgets = getBudgets();

    const dailyPct = budgets.daily > 0
        ? Math.min((totals.today / budgets.daily) * 100, 100)
        : 0;

    const monthlyPct = budgets.monthly > 0
        ? Math.min((totals.monthly / budgets.monthly) * 100, 100)
        : 0;

    $('daily-progress').style.width = `${dailyPct}%`;
    $('monthly-progress').style.width = `${monthlyPct}%`;

    $('daily-progress').style.backgroundColor = dailyPct >= 100
        ? "#EF4444"
        : dailyPct > 80
            ? "#F59E0B"
            : "#10B981";

    $('monthly-progress').style.backgroundColor = monthlyPct >= 100
        ? "#EF4444"
        : monthlyPct > 80
            ? "#F59E0B"
            : "#10B981";

    $('budget-today-spending').textContent = formatCurrency(totals.today);
    $('budget-month-spending').textContent = formatCurrency(totals.monthly);
    $('daily-budget-status').textContent = `${formatCurrency(totals.today)} of ${formatCurrency(budgets.daily)}`;
    $('monthly-budget-status').textContent = `${formatCurrency(totals.monthly)} of ${formatCurrency(budgets.monthly)}`;

    renderBudgetAlert(totals, budgets);
}

function renderBudgetPage() {
    const budgets = getBudgets();

    if ($('daily-budget-input')) $('daily-budget-input').value = budgets.daily;
    if ($('monthly-budget-input')) $('monthly-budget-input').value = budgets.monthly;

    renderBudgetProgress();
}

function renderBudgetAlert(totals, budgets) {
    const dailyExceeded = budgets.daily > 0 && totals.today > budgets.daily;
    const monthlyExceeded = budgets.monthly > 0 && totals.monthly > budgets.monthly;

    if (dailyExceeded || monthlyExceeded) {
        const messages = [];

        if (dailyExceeded) {
            messages.push(
                `Daily budget exceeded (${formatCurrency(totals.today)} of ${formatCurrency(budgets.daily)})`
            );
        }

        if (monthlyExceeded) {
            messages.push(
                `Monthly budget exceeded (${formatCurrency(totals.monthly)} of ${formatCurrency(budgets.monthly)})`
            );
        }

        showMessage(`Budget alert: ${messages.join(" | ")}`, "error");
    }
}

// ============================
// Reports
// ============================

function renderReports() {
    if (!$('category-report')) return;

    const totals = {};

    for (const expense of expenses) {
        const category = expense.category || "Uncategorized";
        totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    }

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    $('category-report').innerHTML = entries.map(([category, amount]) => `
        <div class="report-item">
            <span>${escapeHtml(category)}</span>
            <strong>${formatCurrency(amount)}</strong>
        </div>
    `).join("");

    $('report-empty').classList.toggle("hidden", entries.length > 0);

    const body = $('report-table-body');
    body.innerHTML = "";

    const sorted = [...expenses].sort((a, b) => {
        return parseBackendDate(b.created_at) - parseBackendDate(a.created_at);
    });

    for (const expense of sorted) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(formatDate(expense.created_at))}</td>
            <td>${escapeHtml(expense.title)}</td>
            <td>${escapeHtml(expense.category)}</td>
            <td class="amount-cell amount-positive">${formatCurrency(expense.amount)}</td>
        `;
        body.appendChild(row);
    }
}

// ============================
// Quick expense modal
// ============================

function openExpenseModal() {
    $('quick-expense-modal').classList.remove("hidden");
    $('quick-expense-modal').setAttribute("aria-hidden", "false");
    $('quick-title').focus();
}

function closeExpenseModal() {
    $('quick-expense-modal').classList.add("hidden");
    $('quick-expense-modal').setAttribute("aria-hidden", "true");
}

// ============================
// Logout
// ============================

async function handleLogout() {
    const refreshToken = currentRefreshToken();

    try {
        if (refreshToken) {
            // Current FastAPI endpoint expects refresh_token as a query parameter.
            await fetch(
                `/auth/logout?refresh_token=${encodeURIComponent(refreshToken)}`,
                { method: "POST" }
            );
        }
    } catch {
        // Local session is still cleared even if the server request fails.
    }

    clearSession();
    window.location.href = "/login";
}

// ============================
// Entry point
// ============================

window.addEventListener("DOMContentLoaded", () => {
    setupAuthPage();
    setupDashboard();
});
