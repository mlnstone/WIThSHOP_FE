import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, authHeaders } from "../services/api";

export default function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const accessToken = qs.get("accessToken");
    const refreshToken = qs.get("refreshToken");

    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    // 로그인 후 내 프로필 조회
    (async () => {
      try {
        const { ok, data } = await apiFetch("/api/me", {
          headers: { ...authHeaders() },
        });

        if (!ok) {
          navigate("/login");
          return;
        }

        const { userName, birth, gender, phone } = data;
        if (!userName && !birth && !gender && !phone) {
          navigate("/profile-setup");   // 값이 하나라도 없으면 이동
        } else {
          navigate("/");                // 모두 있으면 홈으로
        }
      } catch {
        navigate("/login");
      }
    })();
  }, [navigate]);

  return <div>로그인 처리중...</div>;
}