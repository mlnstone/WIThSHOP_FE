// src/hooks/useUser.js
import { useEffect, useMemo, useState } from "react";
import { decodeJwt } from "../lib/jwt";
import { apiFetch } from "../services/api";

// helper
const isEmail = (s) => /\S+@\S+\.\S+/.test(s || "");
const localPart = (s) => (s && s.includes("@") ? s.split("@")[0] : s || "");

const pickNameFromToken = (p = {}) =>
  p.name ||
  p.user_name ||
  p.preferred_username ||
  p.nickname ||
  p.given_name ||
  p.username ||
  p.sub || ""; // 보통 이메일

const pickNameFromApi = (d = {}) =>
  d.userName ||        // 서버 DTO(userName) 우선
  d.user_name ||       // snake_case 대비
  d.name ||            // 일반 name
  d.username ||        // username
  d.userEmail ||       // 이메일 키들
  d.email || "";

export default function useUser() {
  const [user, setUser] = useState({ name: "", role: "" });

  // 1) 토큰 읽기 (mount 시 1회)
  const accessToken = useMemo(() => localStorage.getItem("accessToken") || "", []);

  // 2) 토큰에서 우선 표시 (이메일이면 앞부분만)
  useEffect(() => {
    if (!accessToken) return;
    const p = decodeJwt(accessToken);
    if (!p) return;

    const raw = pickNameFromToken(p);
    setUser({
      name: isEmail(raw) ? localPart(raw) : raw,
      role: (p.role || p.auth || "").replace("ROLE_", ""),
    });
  }, [accessToken]);

  // 3) 서버에서 확정 정보로 덮어쓰기 (apiFetch는 BACKEND로 보냄)
  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${accessToken}` };

    apiFetch("/api", { headers, signal: controller.signal })
      .then(({ data }) => {
        const raw = pickNameFromApi(data);
        if (!raw) return;

        setUser({
          name: isEmail(raw) ? localPart(raw) : raw,
          role: (data?.role || "").replace("ROLE_", ""),
        });
      })
      .catch(() => { /* 무시 */ });

    return () => controller.abort();
  }, [accessToken]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.reload();
  };

  return { user, logout, accessToken };
}