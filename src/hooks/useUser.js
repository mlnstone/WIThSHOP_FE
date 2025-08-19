// src/hooks/useUser.js
import { useEffect, useState } from "react";
import { decodeJwt } from "../lib/jwt";
import { apiFetch } from "../services/api";

const isEmail = (s) => /\S+@\S+\.\S+/.test(s || "");
const localPart = (s) => (s && s.includes("@") ? s.split("@")[0] : s || "");

const pickNameFromToken = (p = {}) =>
  // 토큰에 name 없으면 email, 그것도 없으면 sub(이메일일 수도 있음)
  p.name || p.user_name || p.preferred_username || p.nickname ||
  p.given_name || p.username || p.email || p.sub || "";

const pickNameFromApi = (d = {}) =>
  d.userName || d.user_name || d.name || d.username || d.userEmail || d.email || "";

// 🔹 로컬 캐시 읽기
const getCachedName = () => localStorage.getItem("displayName") || "";

export default function useUser() {
  // 1) 동기 초기값: 토큰/캐시에서 즉시 이름 뽑기
  const token = localStorage.getItem("accessToken") || "";
  const claims = token ? decodeJwt(token) || {} : {};
  const tokenNameRaw = pickNameFromToken(claims);
  const tokenName = tokenNameRaw
    ? (isEmail(tokenNameRaw) ? localPart(tokenNameRaw) : tokenNameRaw)
    : ""; // 토큰에 이름이 없으면 빈값
  const cachedName = getCachedName();

  const [user, setUser] = useState({
    // 캐시 > 토큰 이름 순으로 초기 표시 (즉시 렌더)
    name: cachedName || tokenName,
    role: (claims.role || claims.auth || "").replace("ROLE_", ""),
  });
  const [me, setMe] = useState(null);
  const [hydrated, setHydrated] = useState(!token); // 토큰 없으면 즉시 하이드레이트 완료

  // 2) 서버 프로필로 확정 덮어쓰기 + 캐시에 저장
  useEffect(() => {
    if (!token) return;

    const fallbackName = user.name; // 로컬 snapshot

    const controller = new AbortController();
    apiFetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(({ data }) => {
        if (!data) return;
        setMe(data);

        const raw = pickNameFromApi(data);
        const finalName = raw ? (isEmail(raw) ? localPart(raw) : raw) : fallbackName;

        if (finalName) localStorage.setItem("displayName", finalName);

        setUser((u) => ({
          ...u,
          name: finalName || u.name,
          role: (data?.role || "").replace("ROLE_", "") || u.role,
        }));
      })
      .catch(() => {})
      .finally(() => setHydrated(true));

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const needsSetup =
    !!token && !!me && (!me.userName && !me.birth && !me.gender && !me.phone);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("displayName"); // 캐시도 정리(선택)
    window.location.reload();
  };

  const refreshMe = async () => {
    if (!token) return null;
    try {
      const { data } = await apiFetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data) {
        setMe(data);
        const raw = pickNameFromApi(data);
        const finalName = raw ? (isEmail(raw) ? localPart(raw) : raw) : user.name;
        if (finalName) localStorage.setItem("displayName", finalName);
        setUser((u) => ({
          ...u,
          name: finalName || u.name,
          role: (data?.role || "").replace("ROLE_", "") || u.role,
        }));
      }
      return data;
    } finally {
      setHydrated(true);
    }
  };

  return { user, me, needsSetup, hydrated, logout, accessToken: token, refreshMe };

}
