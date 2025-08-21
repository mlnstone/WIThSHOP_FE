// src/app/ProfileGate.js
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useUser from "../hooks/useUser";

export default function ProfileGate({ children }) {
  const { needsSetup, hydrated } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // ① 홈으로 이동할 때 state로 넘긴 "이번 렌더만 우회" 플래그
  const bypassOnce = location.state?.bypassProfileGateOnce === true;

  useEffect(() => {
    // bypass 요청이 있으면 이번 렌더는 통과시키고 state 정리
    if (bypassOnce) {
      navigate(location.pathname + location.search, { replace: true, state: {} });
      return;
    }

    // 아직 /api/me 로딩 전이면 아무것도 하지 않음
    if (!hydrated) return;

    // 비로그인 사용자는 게이트 대상 아님(공용 페이지에서 로그인 페이지로 튕기는 것 방지)
    const hasToken = !!localStorage.getItem("accessToken");
    if (!hasToken) return;

    // 이미 프로필-설정 페이지면 그대로
    if (location.pathname.startsWith("/profile-setup")) return;

    // me를 받아봤고 추가 정보가 비어 있으면 설정 페이지로 유도
    if (needsSetup) {
      navigate("/profile-setup", { replace: true, state: { from: location } });
    }
  }, [bypassOnce, hydrated, needsSetup, location, navigate]);

  return children;
}