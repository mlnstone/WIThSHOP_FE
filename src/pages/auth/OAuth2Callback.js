// src/pages/auth/OAuth2Callback.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api"; // ✅ 공통 apiFetch 사용

export default function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // 1) 쿼리에서 토큰 수거
      const qs = new URLSearchParams(window.location.search);
      const accessToken = qs.get("accessToken");
      const refreshToken = qs.get("refreshToken");

      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      // 쿼리 정리
      if (accessToken || refreshToken) {
        window.history.replaceState({}, "", window.location.pathname);
      }

      // 2) 바로 이름 캐시 (displayName)
      let displayName = "";

      async function fetchMeAndCache() {
        const { ok, data } = await apiFetch("/me", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        if (!ok || !data) return false;

        displayName = data.userName || data.name || data.email || "";
        if (displayName) localStorage.setItem("displayName", displayName);
        return true;
      }

      // JWT 임시 파서 (백업용)
      function tryDecodeJwtName(token) {
        try {
          const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
          );
          return payload?.name || payload?.user_name || payload?.email || "";
        } catch {
          return "";
        }
      }

      // 먼저 /me로 캐시 시도
      const ok = await fetchMeAndCache();

      // 실패하면 JWT에서 임시 이름
      if (!ok && accessToken) {
        const guess = tryDecodeJwtName(accessToken);
        if (guess) localStorage.setItem("displayName", guess);
      }

      // 3) 프로필 세팅 필요 여부 판정 (성공했을 때만 정확)
      let needsSetup = false;
      if (ok) {
        const { data: me } = await apiFetch("/me", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const { userName, birth, gender, phone } = me || {};
        needsSetup = !userName || !birth || !gender || !phone;
      }

      // 4) 라우팅
      if (needsSetup) {
        navigate("/profile-setup", { replace: true });
      } else {
        // 헤더 즉시 반영 위해 전체 새로고침
        window.location.replace("/");
      }
    })();
  }, [navigate]);

  return <div>로그인 처리중...</div>;
}