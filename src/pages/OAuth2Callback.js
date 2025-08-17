import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuth2Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const accessToken = qs.get("accessToken");
    const refreshToken = qs.get("refreshToken");

    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    window.location.replace("/"); 
  }, [navigate]);

  return <div>로그인 처리중...</div>;
}