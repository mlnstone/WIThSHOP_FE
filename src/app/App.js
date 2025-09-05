// src/app/App.js
import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import useUser from "../hooks/useUser";
import AppRoutes from "./routes";
import ProfileGate from "./ProfileGate";
import Footer from "../components/layout/Footer";
import PopupBox from "../components/common/PopupBox";

function AppContent() {
  const { user, logout } = useUser();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="app-container">{/* flex 레이아웃 래퍼 */}
      <Header user={user} onLogout={logout} />
      <ProfileGate>
        <main className="app-main">{/* 남은 높이 채움 */}
          <AppRoutes user={user} onLogout={logout} />
        </main>
      </ProfileGate>
      <Footer />

      {isHome && (
        <>
          <PopupBox
            storageKey="popup1"
            title="BACK-END"
            message="JAVA"
            images={[
              "https://cdn.inflearn.com/public/courses/324474/course_cover/58c8632c-7a6e-4c76-9893-d7fffa32faf2/kyh_JPA_Spring2%20%E1%84%87%E1%85%A9%E1%86%A8%E1%84%89%E1%85%A1%206.png",
            ]}
            offset={{ x: 0, y: 0 }}
          />
          <PopupBox
            storageKey="popup2"
            title="FRONT-END"
            message="REACT"
            images={[
              "https://cdn.inflearn.com/public/files/pages/8862f813-9cd3-4e73-ad24-c58a734fba43/react%20logo%20(1).png",
            ]}
            offset={{ x: 30, y: 30 }}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}