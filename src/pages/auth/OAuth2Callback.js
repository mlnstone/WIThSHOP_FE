// src/pages/OAuth2Callback.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, authHeaders } from "../../services/api";

export default function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const accessToken = qs.get("accessToken");
    const refreshToken = qs.get("refreshToken");

    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    // URL 깨끗하게(쿼리 제거)
    if (accessToken || refreshToken) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    (async () => {
      try {
        const { ok, data } = await apiFetch("/api/me", {
          headers: { ...authHeaders() },
        });
        if (!ok) {
          navigate("/login", { replace: true });
          return;
        }

        const { userName, birth, gender, phone } = data || {};
        const needsSetup = !userName || !birth || !gender || !phone; // ← 하나라도 없으면 true

        if (needsSetup) {
          navigate("/profile-setup", { replace: true });
        } else {
          // 홈으로 하드 새로고침(상태 초기화 & 헤더 즉시 반영)
          window.location.replace("/");
          // 참고: navigate("/") 뒤에 location.reload()도 가능하지만
          // replace("/") 한 번이 더 깔끔합니다.
        }
      } catch {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  return <div>로그인 처리중...</div>;
}