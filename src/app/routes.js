// src/app/routes.jsx (또는 현재 파일 경로)
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./Home";
import LoginPage from "../pages/LoginPage";
import OAuth2Callback from "../pages/OAuth2Callback";
import CategoryPage from "../pages/CategoryPage";
import BoardListPage from "../pages/BoardListPage";
import BoardDetailPage from "../pages/BoardDetailPage";
import MyPage from "../pages/MyPage";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import SignupPage from "../pages/SignupPage";

function hasToken() {
  return !!localStorage.getItem("accessToken");
}

// 로그인한 사용자만 접근
function AuthOnly({ children }) {
  const location = useLocation();
  return hasToken() ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

// 비로그인(게스트)만 접근
function GuestOnly({ children }) {
  return hasToken() ? <Navigate to="/me" replace /> : children;
}

export default function AppRoutes({ user, onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<Home user={user} onLogout={onLogout} />} />

      {/* 게스트 전용 */}
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnly>
            <SignupPage />
          </GuestOnly>
        }
      />

      {/* 인증 필요 */}
      <Route
        path="/me"
        element={
          <AuthOnly>
            <MyPage />
          </AuthOnly>
        }
      />
      <Route
        path="/me/password"
        element={
          <AuthOnly>
            <ChangePasswordPage />
          </AuthOnly>
        }
      />

      {/* 기타 */}
      <Route path="/oauth2/callback" element={<OAuth2Callback />} />
      <Route path="/board" element={<BoardListPage />} />
      <Route path="/board/:boardId" element={<BoardDetailPage />} />
      <Route path="/category/:categoryId" element={<CategoryPage />} />
    </Routes>
  );
}