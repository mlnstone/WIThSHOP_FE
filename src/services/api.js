// src/services/api.js
export const BACKEND = process.env.REACT_APP_BACKEND ?? "http://localhost:8887";

let isRefreshing = false;
let refreshWaiters = [];

async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => refreshWaiters.push({ resolve, reject }));
  }

  isRefreshing = true;
  const refreshToken = localStorage.getItem("refreshToken");

  try {
    if (!refreshToken) throw new Error("no refresh token");

    const res = await fetch(`${BACKEND}/members/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    if (!res.ok) throw new Error(`refresh failed: ${res.status}`);

    const data = await res.json(); // {grantType, accessToken, refreshToken}

    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
    if (data?.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    refreshWaiters.forEach(w => w.resolve(true));
    refreshWaiters = [];
    return true;
  } catch (e) {
    refreshWaiters.forEach(w => w.reject(e));
    refreshWaiters = [];

    // 실패 시 토큰 제거
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function apiFetch(path, options = {}, _triedOnce = false) {
  const { headers = {}, ...rest } = options;
  const url = path.startsWith("http") ? path : `${BACKEND}${path}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json, text/plain;q=0.9,*/*;q=0.8", ...headers },
    ...rest,
  });

  // 401/403 → 1회에 한해 리프레시 → 원요청 재시도
  if ((res.status === 401 || res.status === 403) && !_triedOnce) {
    const ok = await refreshAccessToken();
    if (ok) {
      const token = localStorage.getItem("accessToken");
      const retryHeaders = { ...headers };
      if (token) retryHeaders.Authorization = `Bearer ${token}`;
      return apiFetch(path, { ...options, headers: retryHeaders }, true);
    } else {
      const from = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login?from=${from}`);
      return { ok: false, status: res.status, data: null };
    }
  }

  let data = null;
  const ct = res.headers.get("content-type") || "";
  try {
    data = ct.includes("application/json") ? await res.json() : await res.text();
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}

export function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}