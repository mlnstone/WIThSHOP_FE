// src/components/MenuGrid.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MenuGrid({ items }) {
  const [loadingId, setLoadingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (!items?.length) return <div className="text-muted">표시할 메뉴가 없습니다.</div>;

  const authHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  };

  const handleAdd = async (menuId, quantity = 1) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      // 비로그인 → 로그인으로 보내고, 끝나면 돌아오도록 from 저장
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }

    try {
      setLoadingId(menuId);
      const res = await fetch("/cart/items", {
        // 필요시 "/api/cart/items" 로 변경
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ menuId, quantity }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert((data && (data.message || data.error)) || "장바구니 담기에 실패했습니다.");
        return;
        }

      // 성공 UX
      alert("장바구니에 담았습니다!");
      // TODO: 헤더에 장바구니 뱃지를 쓰신다면 여기서 카운트 새로고침 액션(dispatch) 하면 좋아요.
    } catch (e) {
      console.error(e);
      alert("네트워크 오류로 실패했습니다.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="row g-3">
      {items.map((m) => {
        const id = m.menuId ?? m.id;
        const name = m.menuName ?? m.name ?? "이름 없음";
        const price = m.salePrice ?? m.price ?? 0;
        const img = m.image ?? "https://via.placeholder.com/300x200?text=No+Image";

        const isLoading = loadingId === id;

        return (
          <div className="col-6 col-md-4 col-lg-3" key={id}>
            <div className="card h-100">
              <img
                src={img}
                alt={name}
                className="card-img-top"
                style={{ objectFit: "cover", height: 160 }}
                loading="lazy"
              />
              <div className="card-body d-flex flex-column">
                <div className="fw-semibold mb-1" title={name} style={{ minHeight: 44 }}>
                  {name}
                </div>
                <div className="text-primary fw-bold mb-2">{price.toLocaleString()}원</div>

                <button
                  className="btn btn-sm btn-outline-dark mt-auto"
                  disabled={isLoading}
                  onClick={() => handleAdd(id, 1)}
                >
                  {isLoading ? "담는 중..." : "담기"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}