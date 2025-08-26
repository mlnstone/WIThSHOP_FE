// src/components/cart/AddToCartButton.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "../../hooks/useUser";
import { addCartItem, fetchMyCart } from "../../services/cart";

export default function AddToCartButton({ menuId, quantity = 1, compact = false }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { needsSetup, accessToken } = useUser();

  const onClick = async () => {
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (needsSetup) {
      alert("프로필 설정이 필요합니다.");
      navigate("/profile-setup");
      return;
    }

    try {
      setLoading(true);
      const { ok, data } = await addCartItem(menuId, quantity);
      if (!ok) {
        const msg = typeof data === "string" ? data : (data?.message || "장바구니 담기에 실패했습니다.");
        alert(msg);
        return;
      }

      // 담기 성공 → 서버로부터 총 수량 재계산 후 전파
      const res = await fetchMyCart();
      if (res.ok && res.data?.items) {
        const cnt = res.data.items.reduce((s, it) => s + (it.quantity || 0), 0);
        window.dispatchEvent(new CustomEvent("cart:set", { detail: cnt }));
        try { localStorage.setItem("__cartCount__", String(cnt)); } catch { }
        try { new BroadcastChannel("cart").postMessage({ type: "set", count: cnt }); } catch { }
      } else {
        window.dispatchEvent(new CustomEvent("cart:bump"));
        try { new BroadcastChannel("cart").postMessage({ type: "bump" }); } catch { }
      }

      if (!compact) alert("장바구니에 담았습니다 🛒");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="btn btn-outline-primary same-style"
      title="장바구니 담기"
    >
      <span role="img" aria-label="cart">🛒</span>
      {compact ? (loading ? "..." : "담기") : (loading ? "담는 중..." : "장바구니 담기")}
    </button>
  );
}