// src/app/App.js
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Header from "../components/layout/Header";
import useUser from "../hooks/useUser";
import AppRoutes from "./routes";
import ProfileGate from "./ProfileGate";

export default function App() {
  const { user, logout } = useUser();

   const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  console.log("AccessToken:", accessToken);
  console.log("RefreshToken:", refreshToken);
  return (
    
    <Router>
      <Header user={user} onLogout={logout} />
      <ProfileGate>
        <AppRoutes user={user} onLogout={logout} />
      </ProfileGate>
    </Router>
  );
}