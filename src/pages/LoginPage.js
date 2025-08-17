// src/pages/LoginPage.jsx
import React from "react";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <LoginForm />
    </div>
  );
}