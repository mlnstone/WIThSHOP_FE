import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useUser from "../hooks/useUser";

export default function ProfileGate({ children }) {
  const { needsSetup } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 이미 /profile-setup 이면 그대로
    if (!needsSetup) return;
    if (location.pathname === "/profile-setup") return;

    // 로그인 사용자이면서 추가정보 필요 ⇒ setup으로
    navigate("/profile-setup", { replace: true, state: { from: location } });
  }, [needsSetup, location, navigate]);

  return children;
}