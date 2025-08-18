// src/app/routeGuards.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useUser from "../hooks/useUser";

const hasToken = () => !!localStorage.getItem("accessToken");

/** 로그인한 유저만 접근 가능 */
export function AuthOnly({ children }) {
  const location = useLocation();
  const { authError } = useUser(); // ★ 만료 여부

  if (!hasToken() || authError) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, reason: "expired" }} // ★ 이유 전달
      />
    );
  }
  return children;
}

/** 비로그인(게스트)만 접근 가능 */
export function GuestOnly({ children }) {
  return hasToken() ? <Navigate to="/me" replace /> : children;
}