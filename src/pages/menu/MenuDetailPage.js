// src/pages/menu/MenuDetailPage.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import AddToCartButton from "../../components/cart/AddToCartButton";
import BuyNowButton from "../../components/payment/BuyNowButton";
import InstallmentInfo from "../../components/payment/InstallmentInfo";
import Pagination from "../../components/common/Pagination";
import "./MenuDetailPage.css";
import { useMe } from "../../providers/MeProvider";
import { apiFetch } from "../../services/api";

function extractImages(menu) {
  if (Array.isArray(menu?.images) && menu.images.length) return menu.images;
  if (Array.isArray(menu?.imageList) && menu.imageList.length) return menu.imageList;
  if (typeof menu?.imageUrls === "string" && menu.imageUrls.trim()) {
    return menu.imageUrls.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (menu?.image) return [menu.image];
  return ["https://via.placeholder.com/960x640?text=No+Image"];
}

export default function MenuDetailPage() {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sp, setSp] = useSearchParams();

  const { loading: meLoading } = useMe();

  const [menu, setMenu] = useState(null);
  const [qty, setQty] = useState(1);
  const [menuLoading, setMenuLoading] = useState(true);
  const [err, setErr] = useState("");

  // 리뷰
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [reviews, setReviews] = useState([]);

  // URL 쿼리 → 0-base page
  const reviewPage = useMemo(() => {
    const raw = sp.get("page") ?? sp.get("Page") ?? "0";
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [sp]);

  const [reviewSize, setReviewSize] = useState(5);
  const [reviewPageData, setReviewPageData] = useState({ number: 0, totalPages: 1 });

  // 배송/할부
  const [shippingFee, setShippingFee] = useState(3000);
  const [openInstallment, setOpenInstallment] = useState(false);

  const images = useMemo(() => extractImages(menu), [menu]);
  const [idx, setIdx] = useState(0);
  const go = (d) => setIdx((i) => (i + d + images.length) % images.length);

  // 금액
  const price = menu?.salePrice ?? menu?.price ?? 0;
  const compareAt = menu?.originalPrice ?? menu?.listPrice;
  const discountPct =
    typeof compareAt === "number" && compareAt > price
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : 0;
  const subtotal = useMemo(() => price * qty, [price, qty]);

  // 메뉴 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setMenuLoading(true);
        const { ok, data } = await apiFetch(`/menus/${menuId}`);
        if (!ok) {
          setErr((data && (data.message || data.error)) || "상품을 불러오지 못했습니다.");
          return;
        }
        if (alive) setMenu(data || null);
      } catch {
        setErr("네트워크 오류가 발생했습니다.");
      } finally {
        if (alive) setMenuLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [menuId]);

  // 리뷰 요약
  const loadSummary = useCallback(async () => {
    try {
      const { ok, data } = await apiFetch(`/menus/${menuId}/reviews/summary`);
      if (!ok || !data) return;
      if (typeof data?.count === "number") setReviewCount(data.count);
      const avg = Number(data?.average);
      setAvgRating(Number.isFinite(avg) ? Number(avg.toFixed(2)) : null);
    } catch {}
  }, [menuId]);

  // 리뷰 목록
  const loadReviews = useCallback(
    async (page = reviewPage, size = reviewSize) => {
      try {
        const qs = new URLSearchParams({ page: String(page), size: String(size), sort: "createdAt,desc" });
        const { ok, data } = await apiFetch(`/menus/${menuId}/reviews?${qs.toString()}`);
        if (!ok || !data) return;
        if (Array.isArray(data.content)) setReviews(data.content);
        setReviewPageData({
          number: data.number ?? page,
          totalPages: data.totalPages ?? 1,
        });
      } catch {}
    },
    [menuId, reviewPage, reviewSize]
  );

  // 메뉴 변경 시: page 쿼리 정규화/초기화 + 요약 로드
  useEffect(() => {
    if (!menuId) return;
    loadSummary();

    if (!sp.has("page") && !sp.has("Page")) {
      setSp((prev) => {
        const q = new URLSearchParams(prev);
        q.set("page", "0");
        return q;
      }, { replace: true });
      return;
    }

    if (sp.has("Page") && !sp.has("page")) {
      const v = sp.get("Page");
      setSp((prev) => {
        const q = new URLSearchParams(prev);
        q.delete("Page");
        q.set("page", v ?? "0");
        return q;
      }, { replace: true });
    }
  }, [menuId, sp, setSp, loadSummary]);

  // reviewPage / reviewSize / menuId 변할 때 목록 로드
  useEffect(() => {
    if (!menuId) return;
    loadReviews(reviewPage, reviewSize);
  }, [menuId, reviewPage, reviewSize, loadReviews]);

  // 배송비
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { ok, data } = await apiFetch(`/config/shipping-fee`);
        if (ok && typeof data === "number" && alive) setShippingFee(data);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // 로딩/에러
  if (menuLoading || meLoading) return <div className="container py-4">불러오는 중...</div>;
  if (err) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{err}</div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
            뒤로
          </button>
        </div>
      </div>
    );
  }
  if (!menu) return null;

  const { totalPages } = reviewPageData;

  // Pagination onChange (0-base)
  const goReviewPage = (p) => {
    const next = Math.max(0, Math.min(totalPages - 1, p));
    setSp((prev) => {
      const q = new URLSearchParams(prev);
      q.set("page", String(next));
      return q;
    });
    window.scrollTo({
      top: document.getElementById("reviews-section")?.offsetTop ?? 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="container py-4" style={{ maxWidth: 1160 }}>
      <nav className="mdp-breadcrumb">
        <button className="text-link" onClick={() => navigate(location.state?.from || "/")}>
          Home
        </button>
        <span>/</span>
        <span className="fw-semibold">상품</span>
      </nav>

      <div className="mdp-grid no-thumbs">
        {/* 이미지 영역 */}
        <div className="mdp-main">
          {images.length > 1 && (
            <button className="mdp-arrow left" onClick={() => go(-1)} aria-label="이전">‹</button>
          )}
          <img src={images[idx]} alt={menu.menuName} />
          {images.length > 1 && (
            <button className="mdp-arrow right" onClick={() => go(+1)} aria-label="다음">›</button>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="mdp-info">
          <div className="mdp-rating">
            <span className="star-icon" aria-hidden="true" />
            <span className="score">{avgRating != null ? avgRating.toFixed(1) : "–"}</span>
            <button
              className="link"
              onClick={() =>
                document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              리뷰 {reviewCount.toLocaleString()}건
            </button>
          </div>

          <h2 className="mdp-title">{menu.menuName}</h2>

          <div className="mdp-price">
            {discountPct > 0 && <span className="discount">{discountPct}%</span>}
            <span className="sale">{price.toLocaleString()}원</span>
          </div>
          {typeof compareAt === "number" && compareAt > price && (
            <div className="mdp-compare">{compareAt.toLocaleString()}원</div>
          )}

          <dl className="mdp-meta">
            <div><dt>배송방법</dt><dd>택배</dd></div>
            <div><dt>배송비</dt><dd>{shippingFee.toLocaleString()}원</dd></div>
            <div>
              <dt>무이자 할부</dt>
              <dd><button className="link" onClick={() => setOpenInstallment(true)}>카드 자세히 보기</button></dd>
            </div>
          </dl>

          <div className="d-flex flex-column gap-3 text-start" style={{ maxWidth: 440 }}>
            <div>
              <label className="form-label">수량</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="form-control text-start"
              />
            </div>

            <div className="small text-muted">
              상품합계 {subtotal.toLocaleString()}원 · 배송비 +{shippingFee.toLocaleString()}원
            </div>

            <div className="mdp-actions">
              <AddToCartButton menuId={menu.menuId} quantity={qty} />
              <BuyNowButton menuId={menu.menuId} quantity={qty} />
            </div>
          </div>
        </div>
      </div>

      {/* 리뷰 섹션 */}
      <section id="reviews-section" className="mdp-reviews">
        <div className="d-flex justify-content-between align-items-end">
          <h4 className="m-0 d-flex align-items-center gap-2">
            <span className="rating-pair big">
              <span className="star-icon" aria-hidden="true" />
              <span className="rating-num">{avgRating != null ? avgRating.toFixed(1) : "–"}</span>
            </span>
            <span className="text-muted">· 리뷰 {reviewCount.toLocaleString()}건</span>
          </h4>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">페이지당</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 80 }}
            value={reviewSize}
            onChange={(e) => {
              const s = Number(e.target.value) || 5;
              setReviewSize(s);
              setSp((prev) => {
                const q = new URLSearchParams(prev);
                q.set("page", "0");
                return q;
              });
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </div>
        </div>

        <div className="list-group mt-3 mb-3">
          {reviews.length === 0 && <div className="text-muted">아직 리뷰가 없습니다.</div>}
          {reviews.map((rv) => (
            <div key={rv.reviewId} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <strong>{rv.reviewTitle}</strong>
                <span className="rating-pair">
                  <span className="star-icon" aria-hidden="true" />
                  <span className="rating-num">{Number(rv.rating).toFixed(1)}</span>
                </span>
              </div>
              <div className="small text-muted mb-1">
                {rv.userName} · {rv.createdAt ? new Date(rv.createdAt).toLocaleDateString() : ""}
              </div>
              <div>{rv.reviewContent}</div>
              {rv.reviewImage && (
                <div className="mt-2">
                  <img
                    src={rv.reviewImage}
                    alt="review"
                    style={{ maxWidth: 200, height: "auto", borderRadius: 8 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <Pagination
          page={reviewPage}
          totalPages={reviewPageData.totalPages}
          blockSize={5}
          onChange={goReviewPage}
          variant="dark"
          size="sm"
          className="justify-content-center"
        />
      </section>

      <InstallmentInfo open={openInstallment} onClose={() => setOpenInstallment(false)} />
    </div>
  );
}