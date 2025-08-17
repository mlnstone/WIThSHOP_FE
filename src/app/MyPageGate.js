import React from "react";
import { Navigate } from "react-router-dom";
import useUser from "../hooks/useUser";
import MyPage from "../pages/MyPage";

export default function MyPageGate() {
  const { needsSetup } = useUser(); // 이름/생일/성별/폰 중 하나라도 비면 true
  if (needsSetup) return <Navigate to="/profile-setup" replace />;
  return <MyPage />;
}