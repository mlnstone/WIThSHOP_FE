// src/pages/OAuth2Callback.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
      //    - /api/me 성공 시: userName(우선) → name → email
      //    - 실패 시: JWT에서 name/email 파싱 시도(임시 표시용)
      let displayName = "";

      async function fetchMeAndCache() {
        try {
          const res = await fetch("/api/me", {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          });
        if (!res.ok) return false;

          const me = await res.json();
          displayName = me?.userName || me?.name || me?.email || "";
          if (displayName) localStorage.setItem("displayName", displayName);
          return true;
        } catch {
          return false;
        }
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

      // 먼저 /api/me로 캐시 시도
      const ok = await fetchMeAndCache();

      // 실패하면 JWT에서 임시 이름
      if (!ok && accessToken) {
        const guess = tryDecodeJwtName(accessToken);
        if (guess) localStorage.setItem("displayName", guess);
      }

      // 3) 프로필 세팅 필요 여부 판정
      //    (/api/me가 성공했을 때만 정확히 판단 가능)
      let needsSetup = false;
      if (ok) {
        try {
          const res = await fetch("/api/me", {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          });
          const me = await res.json();
          const { userName, birth, gender, phone } = me || {};
          needsSetup = !userName || !birth || !gender || !phone;
        } catch {
          // 판단 불가면 일단 홈으로
          needsSetup = false;
        }
      }

      // 4) 라우팅
      if (needsSetup) {
        navigate("/profile-setup", { replace: true });
      } else {
        // 하드 새로고침으로 헤더 즉시 반영
        window.location.replace("/");
      }
    })();
  }, [navigate]);

  return <div>로그인 처리중...</div>;
}