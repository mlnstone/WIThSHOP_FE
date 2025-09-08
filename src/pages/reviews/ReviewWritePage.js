// src/pages/reviews/ReviewWritePage.js
import React, { useMemo, useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import ReviewForm from "../../components/reviews/ReviewForm";
import { apiFetch, authHeaders } from "../../services/api";

export default function ReviewWritePage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const orderCode = sp.get("orderCode") || "";
  const menuIdStr = sp.get("menuId") || "";
  const menuId = useMemo(() => {
    const n = Number(menuIdStr);
    return Number.isFinite(n) ? n : null;
  }, [menuIdStr]);

  // 메뉴 상세 상태
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  // 진입 가드: 이미 해당 주문/상품으로 리뷰가 있으면 차단
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!orderCode || !menuId) return;
      try {
        const { ok, data } = await apiFetch(
          `/reviews/exists?menuId=${menuId}&orderCode=${orderCode}`,
          { headers: authHeaders() }
        );
        if (alive && ok && data?.exists) {
          alert("이미 이 주문에 대한 리뷰를 작성하셨습니다.");
          navigate(`/menus/${menuId}#reviews`, { replace: true });
        }
      } catch {
        // 서버가 최종 검증하므로 조용히 무시
      }
    })();
    return () => { alive = false; };
  }, [menuId, orderCode, navigate]);

  // 메뉴 상세 불러오기 (이름/이미지 표시용)
  useEffect(() => {
    if (!menuId) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { ok, data } = await apiFetch(`/menus/${menuId}`, {
          headers: authHeaders(),
        });
        if (alive && ok) setMenu(data || null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [menuId]);

  if (!orderCode || !menuId) {
    return (
      <div className="container py-4" style={{ maxWidth: 720 }}>
        <div className="alert alert-warning">
          잘못된 접근입니다. (orderCode/menuId 없음)
        </div>
        <Link to="/" className="btn btn-outline-secondary">홈으로</Link>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h2 className="fw-bold mb-3">리뷰 작성</h2>

      {/* 메뉴 이름/이미지 표시 */}
      {loading && <div className="text-muted mb-3">메뉴 정보를 불러오는 중...</div>}
      {menu && (
        <div className="d-flex align-items-center mb-3">
          <img
            // src={menu.menuImageUrl || "/noimage.png"}
            src="https://image.zeta-ai.io/profile-image/c7465638-8779-49b4-9158-bc3d504d2333/a683c4cf-7c04-48eb-97d4-043400c3205e.jpeg?w=96&q=75&f=webp"
            alt={menu.menuName}
            width={72}
            height={72}
            style={{ objectFit: "cover", borderRadius: 8, background: "#f8f9fa" }}
            onError={(e) => (e.currentTarget.src = "/noimage.png")}
          />
          <div className="ms-3">
            <div className="fw-semibold">{menu.menuName}</div>
          </div>
        </div>
      )}

      <ReviewForm
        menuId={menuId}
        orderCode={orderCode}   // ✅ 주문번호 넘김
        onSuccess={() => {
          navigate(`/menus/${menuId}#reviews`, { replace: true });
        }}
      />
    </div>
  );
}