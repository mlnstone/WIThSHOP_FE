// src/components/main/HomeWelcomeCard.js
import React from "react";
import BestMenusGrid from "./BestMenusGrid";   // 추가

export default function HomeWelcomeCard({ user, onLogout }) {
  return (
    <>
      {/* 베스트 상품 */}
      <BestMenusGrid />
    </>
  );
}