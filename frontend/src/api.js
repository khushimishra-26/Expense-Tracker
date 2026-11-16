// Small fetch wrapper for the FastAPI backend.
//
// Security notes:
// - The access token is kept in memory only (not localStorage), so injected
//   scripts can't read it from storage.
// - The refresh token is an httpOnly cookie set by the backend; JS never sees it.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let accessToken = null;
let refreshing = null;
let onSessionExpired = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

function errorMessage(data, fallback) {
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) return data.detail[0]?.msg || fallback;
  return fallback;
}

// Get a new access token using the refresh cookie. Concurrent callers share
// one request, because each refresh rotates (invalidates) the old cookie.
export function refreshSession() {
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          accessToken = null;
          return null;
        }
        const data = await res.json();
        accessToken = data.access_token;
        return data;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function api(path, { method = "GET", body } = {}, retried = false) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access token expired: refresh once and retry
  if (res.status === 401 && !retried) {
    const session = await refreshSession();
    if (session) return api(path, { method, body }, true);
    onSessionExpired();
    throw new Error("Session expired. Please log in again.");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(data, "Something went wrong"));
  return data;
}

export async function loginRequest(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include", // so the browser stores the refresh cookie
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(data, "Login failed"));
  accessToken = data.access_token;
}

export async function logoutRequest() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  accessToken = null;
}
