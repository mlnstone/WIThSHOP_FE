import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const hasToken = () => !!localStorage.getItem("accessToken");

/** 로그인한 유저만 접근 가능 */
export function AuthOnly({ children }) {
  const location = useLocation();
  return hasToken()
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
}

/** 비로그인(게스트)만 접근 가능 */
export function GuestOnly({ children }) {
  return hasToken()
    ? <Navigate to="/me" replace />  // 혹은 "/" 로 보내도 됨
    : children;
}