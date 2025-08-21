// src/pages/LoginPage.js
import React from "react";
import { useLocation } from "react-router-dom";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  const location = useLocation();
  const reason = location.state?.reason;

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      {reason === "expired" && (
        <div className="alert alert-warning mb-3">
          로그인 후 이용해주세요.
        </div>
      )}
      <LoginForm />
    </div>
  );
}