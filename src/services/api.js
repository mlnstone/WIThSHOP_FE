export const BACKEND = process.env.REACT_APP_BACKEND ?? "http://localhost:8887";

export async function apiFetch(path, options = {}) {
  const { headers = {}, ...rest } = options;
  const url = path.startsWith("http") ? path : `${BACKEND}${path}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
      ...headers,
    },
    ...rest,
  });

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