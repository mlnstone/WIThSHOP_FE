export const BACKEND = process.env.REACT_APP_BACKEND || "http://localhost:8887";

// 공통 fetch 래퍼
export async function apiFetch(path, { headers = {}, signal, ...rest } = {}) {
  const url = path.startsWith("http") ? path : `${BACKEND}${path}`;
  const res = await fetch(url, { headers, signal, ...rest });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: {} };
  }
}