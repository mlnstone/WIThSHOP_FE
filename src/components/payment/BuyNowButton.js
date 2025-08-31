// src/components/payment/BuyNowButton.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "../../hooks/useUser";

export default function BuyNowButton({ menuId, quantity = 1 }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { needsSetup, accessToken } = useUser();

  const onClick = async () => {
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      navigate("/login", { state: { from: `/checkout/benefits?menuId=${menuId}&qty=${quantity}` } });
      return;
    }
    if (needsSetup) {
      alert("프로필 설정이 필요합니다.");
      navigate("/profile-setup");
      return;
    }

    try {
      setLoading(true);
      // ✅ 장바구니와 달리 바로 결제 페이지로 이동
      navigate(`/checkout/benefits?menuId=${menuId}&qty=${quantity}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="btn btn-dark same-style"

      title="바로 구매하기"
    >
      {loading ? "처리 중..." : "구매하기"}
    </button>
  );
}