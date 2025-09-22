// src/app/routes.js
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./Home";
import LoginPage from "../pages/auth/LoginPage";
import OAuth2Callback from "../pages/auth/OAuth2Callback";
import CategoryPage from "../pages/category/CategoryPage";
import BoardListPage from "../pages/board/BoardListPage";
import BoardDetailPage from "../pages/board/BoardDetailPage";
import MyPage from "../pages/auth/MyPage";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";
import SignupPage from "../pages/auth/SignupPage";
import ProfileSetupPage from "../pages/auth/ProfileSetupPage";
import ProfileGate from "./ProfileGate";
import CartPage from "../pages/menu/CartPage";
import MenuDetailPage from "../pages/menu/MenuDetailPage";
import BenefitsPage from "../pages/checkout/CheckoutPage";
import OrderDetailPage from "../pages/order/OrderDetailPage";
import MyOrdersPage from "../pages/order/MyOrdersPage";
import ReviewWritePage from "../pages/reviews/ReviewWritePage";
import MyReviewsPage from "../pages/reviews/MyReviewsPage";
import BestByText from "../pages/category/BestByText";

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
      <Route
        path="/"
        element={
          <ProfileGate>
            <Home user={user} onLogout={onLogout} />
          </ProfileGate>
        }
      />

      <Route
        path="/orders/code/:orderCode"
        element={
          <AuthOnly>
            <ProfileGate>
              <OrderDetailPage />
            </ProfileGate>
          </AuthOnly>
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

      {/* 인증 필요 */}
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
      <Route
        path="/me/orders"
        element={
          <AuthOnly>
            <ProfileGate>
              <MyOrdersPage />
            </ProfileGate>
          </AuthOnly>
        }
      />

      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/menus/:menuId" element={<MenuDetailPage />} />

      <Route path="/reviews/write" element={<ReviewWritePage />} />
      <Route path="/me/reviews"
        element={
          <AuthOnly>
            <ProfileGate>
              <MyReviewsPage />
            </ProfileGate>
          </AuthOnly>
        }
      />
      {/* ✅ 결제 페이지는 로그인 필요 */}
      <Route
        path="/checkout/benefits"
        element={
          <AuthOnly>
            <ProfileGate>
              <BenefitsPage />
            </ProfileGate>
          </AuthOnly>
        }
      />

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

      <Route
        path="/cart"
        element={
          <AuthOnly>
            <ProfileGate>
              <CartPage />
            </ProfileGate>
          </AuthOnly>
        }
      />

      {/* OAuth 콜백 */}
      <Route path="/oauth2/callback" element={<OAuth2Callback />} />

      {/* ai */}
      <Route path="/category/best-by-text" element={<BestByText />} />

    </Routes>
  );
}