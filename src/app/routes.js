import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import LoginPage from "../pages/LoginPage";
import OAuth2Callback from "../pages/OAuth2Callback";
import CategoryPage from "../pages/CategoryPage";
import BoardListPage from "../pages/BoardListPage";
import BoardDetailPage from "../pages/BoardDetailPage";

export default function AppRoutes({ user, onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<Home user={user} onLogout={onLogout} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/callback" element={<OAuth2Callback />} />
      {/* <Route path="/signup" element={<SignupPage />} /> */}
      {/* <Route path="/upload" element={<UploadPage />} /> */}
      <Route path="/board" element={<BoardListPage />} />
      <Route path="/board/:boardId" element={<BoardDetailPage />} />
      <Route path="/category/:categoryId" element={<CategoryPage />} />
    </Routes>
  );
}