// src/components/menu/MenuGrid.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ---- 간단 캐시: 같은 메뉴의 리뷰 요약 중복 요청 방지 ----
const reviewCache = new Map(); // key: menuId, value: { avg, count }

// ---- 커스텀 훅: 리뷰 요약 불러오기 ----
function useReviewSummary(menuId, seedAvg, seedCount) {
  const [avg, setAvg] = useState(
    typeof seedAvg === "number" ? Number(seedAvg) : null
  );
  const [count, setCount] = useState(
    typeof seedCount === "number" ? Number(seedCount) : null
  );
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const needFetch = useMemo(() => {
    if (!menuId) return false;
    if (avg != null && count != null) return false; // 이미 아이템이 제공
    if (reviewCache.has(menuId)) return false;      // 캐시에 있음
    return true;
  }, [menuId, avg, count]);

  useEffect(() => {
    if (!menuId) return;

    // 캐시에 있으면 즉시 사용
    if (reviewCache.has(menuId)) {
      const { avg: cAvg, count: cCount } = reviewCache.get(menuId);
      setAvg(cAvg);
      setCount(cCount);
      return;
    }
    if (!needFetch) return;

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const r = await fetch(`/menus/${menuId}/reviews/summary`, {
          signal: controller.signal,
        });
        if (!r.ok) return;
        const j = await r.json().catch(() => null);
        const a = Number(j?.average);
        const c = Number(j?.count);
        const safeAvg = Number.isFinite(a) ? Number(a.toFixed(2)) : null;
        const safeCnt = Number.isFinite(c) ? c : 0;
        reviewCache.set(menuId, { avg: safeAvg, count: safeCnt });
        setAvg(safeAvg);
        setCount(safeCnt);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [menuId, needFetch]);

  return { avg, count, loading };
}
// ---- 카드 한 장 컴포넌트 (훅은 여기서 사용) ----
function MenuCard({ item, onAdd, onGoDetail, isLoading }) {
  const id = item.menuId ?? item.id;
  const name = item.menuName ?? item.name ?? "이름 없음";
  const img = item.image ?? "https://via.placeholder.com/300x200?text=No+Image";

  // 가격 계산: 그리드에서도 디테일과 동일한 규칙
  const price = item.salePrice ?? item.price ?? 0;                 // 실제 판매가
  const compareAt = item.originalPrice ?? item.listPrice ?? null;  // 정가(있을 때만)
  const discountPct =
    typeof compareAt === "number" && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : 0;

  // 서버에서 이미 제공할 수도 있는 필드명 대응
  const seedAvg =
    item.avgRating ??
    item.averageRating ??
    item.ratingAverage ??
    (typeof item.rating === "number" ? item.rating : null);
  const seedCount =
    item.reviewCount ?? item.reviewsCount ?? item.ratingCount ?? null;

  const { avg, count } = useReviewSummary(id, seedAvg, seedCount);

  return (
    <div className="col-6 col-md-4 col-lg-3" key={id}>
      <div
        className="card h-100"
        role="button"
        tabIndex={0}
        onClick={() => onGoDetail(id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onGoDetail(id)}
        style={{ cursor: "pointer" }}
      >
        <img
          src={img}
          alt={name}
          className="card-img-top"
          style={{ objectFit: "cover", height: 160 }}
          loading="lazy"
        />
        <div className="card-body d-flex flex-column">
          {/* 이름 */}
          <div className="fw-semibold mb-1" title={name} style={{ minHeight: 24 }}>
            {name}
          </div>

          {/* ⭐️ 평점/리뷰수 (있을 때만) */}
          {avg != null && count != null && (
            <div className="text-muted small mb-1 d-flex align-items-center gap-1" aria-label={`평점 ${avg}점, 리뷰 ${count}개`}>
              <span className="star-icon" aria-hidden="true" />
              <span>{avg.toFixed(1)} ({count.toLocaleString()})</span>
            </div>
          )}
          {typeof compareAt === "number" && compareAt > price && (
            <div className="text-muted" style={{ textDecoration: "line-through" }}>
              {compareAt.toLocaleString()}원
            </div>
          )}
          {/* 가격 영역 */}
          <div className="mb-1 d-flex align-items-baseline gap-2">
            {discountPct > 0 && (
              <span className="fw-bold" style={{ color: "#E03131" }}>
                {discountPct}%{/* 빨강 퍼센트 */}
              </span>
            )}
            <span className="fw-bold" style={{ fontSize: 18, color: "#0B1320" }}>
              {price.toLocaleString()}원
            </span>
          </div>


          {/* 담기 */}
          <button
            className="btn btn-sm btn-outline-dark mt-auto"
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd(id, 1);
            }}
          >
            {isLoading ? "담는 중..." : "담기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- 그리드(목록) 컴포넌트 ----
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

  const goDetail = (menuId) => {
    navigate(`/menus/${menuId}`, { state: { from: location } });
  };

  const handleAdd = async (menuId, quantity = 1) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }
    try {
      setLoadingId(menuId);
      const res = await fetch("/cart/items", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ menuId, quantity }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert((data && (data.message || data.error)) || "장바구니 담기에 실패했습니다.");
        return;
      }
      alert("장바구니에 담았습니다!");
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
        return (
          <MenuCard
            key={id}
            item={m}
            onAdd={handleAdd}
            onGoDetail={goDetail}
            isLoading={loadingId === id}
          />
        );
      })}
    </div>
  );
}