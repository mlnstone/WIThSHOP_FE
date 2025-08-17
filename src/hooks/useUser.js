import { useEffect, useMemo, useState } from "react";
import { decodeJwt } from "../lib/jwt";
import { apiFetch } from "../services/api";

const isEmail = (s) => /\S+@\S+\.\S+/.test(s || "");
const localPart = (s) => (s && s.includes("@") ? s.split("@")[0] : s || "");

const pickNameFromToken = (p = {}) =>
  p.name || p.user_name || p.preferred_username || p.nickname || p.given_name || p.username || p.sub || "";

const pickNameFromApi = (d = {}) =>
  d.userName || d.user_name || d.name || d.username || d.userEmail || d.email || "";

export default function useUser() {
  const [user, setUser] = useState({ name: "", role: "" });
  const [me, setMe] = useState(null);               // ← 서버 프로필 원본
  const accessToken = useMemo(() => localStorage.getItem("accessToken") || "", []);

  // 토큰 표시용 이름/권한
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

  // 서버 프로필 호출
  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    apiFetch("/api/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
      .then(({ data }) => {
        if (!data) return;
        setMe(data);
        const raw = pickNameFromApi(data);
        if (raw) {
          setUser((u) => ({
            ...u,
            name: isEmail(raw) ? localPart(raw) : raw,
            role: (data?.role || "").replace("ROLE_", "") || u.role,
          }));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [accessToken]);

  // 4개 필드 중 하나라도 비어 있으면 setup 필요
  const needsSetup =
    !!accessToken &&
    !!me &&
    (!me.userName || !me.birth || !me.gender || !me.phone);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.reload();
  };

  return { user, me, needsSetup, logout, accessToken };
}