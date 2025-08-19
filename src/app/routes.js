// src/app/routes.jsx
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
import ProfileSetupPage from "../pages/ProfileSetupPage";
import ProfileGate from "./ProfileGate";

function hasToken() {
  return !!localStorage.getItem("accessToken");
}

// 로그인한 사용자만 접근
function AuthOnly({ children }) {
  const location = useLocation();
  return hasToken()
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
}

// 비로그인(게스트)만 접근
function GuestOnly({ children }) {
  return hasToken()
    ? <Navigate to="/me" replace />
    : children;
}

export default function AppRoutes({ user, onLogout }) {
  return (
    <Routes>
      {/* 프로필 미설정이면 어디서든 setup으로 보내고 싶은 “일반 페이지들”은 ProfileGate로 감싸기 */}
      <Route
        path="/"
        element={
          <ProfileGate>
            <Home user={user} onLogout={onLogout} />
          </ProfileGate>
        }
      />

      <Route
        path="/board"
        element={
          <ProfileGate>
            <BoardListPage />
          </ProfileGate>
        }
      />
      <Route
        path="/board/:boardId"
        element={
          <ProfileGate>
            <BoardDetailPage />
          </ProfileGate>
        }
      />
      <Route
        path="/category/:categoryId"
        element={
          <ProfileGate>
            <CategoryPage />
          </ProfileGate>
        }
      />

      {/* 인증 필요 페이지들 */}
      <Route
        path="/me"
        element={
          <AuthOnly>
            <ProfileGate>
              <MyPage />
            </ProfileGate>
          </AuthOnly>
        }
      />
      <Route
        path="/me/password"
        element={
          <AuthOnly>
            <ProfileGate>
              <ChangePasswordPage />
            </ProfileGate>
          </AuthOnly>
        }
      />

      <Route path="/profile-setup" element={<ProfileSetupPage />} />

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
    
      {/* OAuth 콜백 (중복 선언 제거) */}
      <Route path="/oauth2/callback" element={<OAuth2Callback />} />
    </Routes>
  );
}