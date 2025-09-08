// src/components/menu/MenuGrid.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, authHeaders } from "../../services/api";

const reviewCache = new Map();

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
    if (avg != null && count != null) return false;
    if (reviewCache.has(menuId)) return false;
    return true;
  }, [menuId, avg, count]);

  useEffect(() => {
    if (!menuId) return;
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
        const { ok, data } = await apiFetch(
          `/menus/${menuId}/reviews/summary`,
          { signal: controller.signal }
        );
        if (!ok) return;
        const a = Number(data?.average);
        const c = Number(data?.count);
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

function MenuCard({ item, onAdd, onGoDetail, isLoading, colClass }) {
  const id = item.menuId ?? item.id;
  const name = item.menuName ?? item.name ?? "이름 없음";

  const price = item.salePrice ?? item.price ?? 0;
  const compareAt = item.originalPrice ?? item.listPrice ?? null;
  const discountPct =
    typeof compareAt === "number" && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : 0;

  const seedAvg =
    item.avgRating ??
    item.averageRating ??
    item.ratingAverage ??
    (typeof item.rating === "number" ? item.rating : null);
  const seedCount = item.reviewCount ?? item.reviewsCount ?? item.ratingCount ?? null;

  const { avg, count } = useReviewSummary(id, seedAvg, seedCount);

  return (
    <div className={colClass} key={id}>
      <div
        className="card h-100 card-hover"
        role="button"
        tabIndex={0}
        onClick={() => onGoDetail(id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onGoDetail(id)}
        style={{ cursor: "pointer" }}
      >
        {/* 1:1 이미지 영역 */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", overflow: "hidden" }}>
          <img
            src="https://i.namu.wiki/i/tlD-CsVpOQNVhXNTdFNOVYVoHvto8Dfwd1kls-ayVEd2WNN8Qem79cJy1xzJ6vpLAw67HDnGU4b5CgvoqUb5Q-HKkIg7m0I8QQHBf1UEXwa6F2i0iBhxFtqU8-nXEhelUDVssDsBwtHNmu5eEPTyWQ.webp"

            alt={name}
            className="card-img-top"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/600?text=No+Image")}
          />
        </div>

        <div className="card-body d-flex flex-column">
          <div className="fw-semibold mb-1" title={name} style={{ minHeight: 24 }}>{name}</div>

          {avg != null && count != null && (
            <div
              className="text-muted small mb-1 d-flex align-items-center gap-1"
              aria-label={`평점 ${avg}점, 리뷰 ${count}개`}
            >
              <span className="star-icon" aria-hidden="true" />
              <span>{avg.toFixed(1)} ({count.toLocaleString()})</span>
            </div>
          )}

          {typeof compareAt === "number" && compareAt > price && (
            <div className="text-muted" style={{ textDecoration: "line-through" }}>
              {compareAt.toLocaleString()}원
            </div>
          )}

          <div className="mb-1 d-flex align-items-baseline gap-2">
            {discountPct > 0 && (
              <span className="fw-bold" style={{ color: "#E03131" }}>{discountPct}%</span>
            )}
            <span className="fw-bold" style={{ fontSize: 18, color: "#0B1320" }}>
              {price.toLocaleString()}원
            </span>
          </div>

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

export default function MenuGrid({ items, colClass = "col-6 col-md-4 col-lg-3" }) {
  const [loadingId, setLoadingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (!items?.length) return <div className="text-muted">표시할 메뉴가 없습니다.</div>;

  const goDetail = (menuId) =>
    navigate(`/menus/${menuId}`, { state: { from: location } });

  const handleAdd = async (menuId, quantity = 1) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }
    try {
      setLoadingId(menuId);
      const { ok, data } = await apiFetch("/cart/items", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, quantity }),
      });
      if (!ok) {
        const msg = (data && (data.message || data.error)) || "장바구니 담기에 실패했습니다.";
        alert(msg);
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
            colClass={colClass}
          />
        );
      })}
    </div>
  );
}