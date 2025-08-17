import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Header from "../components/layout/Header";
import useUser from "../hooks/useUser";
import AppRoutes from "./routes";

export default function App() {
  const { user, logout } = useUser();

  return (
    <Router>
      <Header user={user} onLogout={logout} />
      <AppRoutes user={user} onLogout={logout} />
    </Router>
  );
}