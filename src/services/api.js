// src/services/api.js
import { signOut } from "./auth";

export const BACKEND = process.env.REACT_APP_BACKEND ?? "";

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

    const data = await res.json(); // { grantType, accessToken, refreshToken }
    if (data?.accessToken) localStorage.setItem("accessToken", data.accessToken);
    if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

    refreshWaiters.forEach((w) => w.resolve(true));
    refreshWaiters = [];
    return true;
  } catch (e) {
    refreshWaiters.forEach((w) => w.reject(e));
    refreshWaiters = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}

function getSafeBackPath() {
  const here = new URL(window.location.href);
  here.searchParams.delete("from");
  return here.pathname + (here.search ? here.search : "");
}

export async function apiFetch(path, options = {}, _triedOnce = false) {
  const { headers = {}, ...rest } = options;
  const url = path.startsWith("http") ? path : `${BACKEND}${path}`;

  // 토큰 보유 여부(Authorization 헤더 또는 localStorage 토큰)
  const lcToken = localStorage.getItem("accessToken");
  const hdrAuth = Object.keys(headers).some((k) => k.toLowerCase() === "authorization");
  const hasAuth = !!(lcToken || hdrAuth);

  // ✅ 최초 요청에도 토큰 자동 주입
  const finalHeaders = {
    Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
    ...headers,
  };
  if (!hdrAuth && lcToken) {
    finalHeaders.Authorization = `Bearer ${lcToken}`;
  }

  const res = await fetch(url, {
    headers: finalHeaders,
    ...rest,
  });

  // 만료/권한 오류 시 한 번만 리프레시 후 재시도
  if (hasAuth && (res.status === 401 || res.status === 403) && !_triedOnce) {
    const ok = await refreshAccessToken();
    if (ok) {
      const token = localStorage.getItem("accessToken");
      const retryHeaders = { ...finalHeaders };
      if (token) retryHeaders.Authorization = `Bearer ${token}`;
      return apiFetch(path, { ...options, headers: retryHeaders }, true);
    } else {
      const back = getSafeBackPath();
      signOut(back); // from 중첩 없이 한 번만
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