// src/pages/menu/MenuDetailPage.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AddToCartButton from "../../components/cart/AddToCartButton";
import InstallmentInfo from "../../components/payment/InstallmentInfo";
// import ReviewForm from "../../components/review/ReviewForm";
import "./MenuDetailPage.css";

function extractImages(menu) {
  if (Array.isArray(menu?.images) && menu.images.length) return menu.images;
  if (Array.isArray(menu?.imageList) && menu.imageList.length) return menu.imageList;
  if (typeof menu?.imageUrls === "string" && menu.imageUrls.trim()) {
    return menu.imageUrls.split(",").map(s => s.trim()).filter(Boolean);
  }
  if (menu?.image) return [menu.image];
  return ["https://via.placeholder.com/960x640?text=No+Image"];
}

export default function MenuDetailPage() {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [menu, setMenu] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 리뷰 요약 + 목록(페이징)
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [reviews, setReviews] = useState([]);

  // ✨ 페이징 상태
  const [reviewPage, setReviewPage] = useState(0);     // 0-base
  const [reviewSize, setReviewSize] = useState(5);
  const [reviewPageData, setReviewPageData] = useState({
    number: 0,
    totalPages: 1,
    first: true,
    last: true,
  });

  // 배송비
  const [shippingFee, setShippingFee] = useState(3000);

  // 할부 모달
  const [openInstallment, setOpenInstallment] = useState(false);

  const images = useMemo(() => extractImages(menu), [menu]);
  const [idx, setIdx] = useState(0);
  const go = (d) => setIdx(i => (i + d + images.length) % images.length);

  // 메뉴 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/menus/${menuId}`);
        const j = await r.json().catch(() => null);
        if (!r.ok) { setErr(j?.message || "상품을 불러오지 못했습니다."); return; }
        alive && setMenu(j);
      } catch {
        setErr("네트워크 오류가 발생했습니다.");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [menuId]);

  // 요약(개수/평균)
  const loadSummary = useCallback(async () => {
    try {
      const r = await fetch(`/menus/${menuId}/reviews/summary`);
      if (!r.ok) return;
      const j = await r.json();
      if (typeof j?.count === "number") setReviewCount(j.count);
      const avg = Number(j?.average);
      setAvgRating(Number.isFinite(avg) ? Number(avg.toFixed(2)) : null);
    } catch { }
  }, [menuId]);

  // 리뷰 목록(최신순만)
  const loadReviews = useCallback(async (page = reviewPage, size = reviewSize) => {
    try {
      const qs = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort: "createdAt,desc", // ✅ 최신순 고정
      });
      const r = await fetch(`/menus/${menuId}/reviews?${qs.toString()}`);
      const j = await r.json().catch(() => null);
      if (!j) return;
      if (Array.isArray(j.content)) setReviews(j.content);
      setReviewPageData({
        number: j.number ?? page,
        totalPages: j.totalPages ?? 1,
        first: j.first ?? page === 0,
        last: j.last ?? true,
      });
    } catch { }
  }, [menuId, reviewPage, reviewSize]);

  // 요약/목록 로드
  useEffect(() => {
    if (!menuId) return;
    loadSummary();
    // 첫 진입 시 0페이지
    setReviewPage(0);
    loadReviews(0, reviewSize);
  }, [menuId, loadSummary, loadReviews, reviewSize]);

  // 배송비
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/config/shipping-fee`);
        if (!r.ok) return;
        const fee = await r.json().catch(() => null);
        alive && typeof fee === "number" && setShippingFee(fee);
      } catch { }
    })();
    return () => { alive = false; };
  }, []);

  const price = menu?.salePrice ?? menu?.price ?? 0;
  const compareAt = menu?.originalPrice ?? menu?.listPrice;
  const discount =
    (typeof compareAt === "number" && compareAt > price)
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : 0;

  if (loading) return <div className="container py-4">불러오는 중…</div>;
  if (err) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{err}</div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>뒤로</button>
        </div>
      </div>
    );
  }
  if (!menu) return null;

  const { number, totalPages, first, last } = reviewPageData;

  // 페이지 이동
  const goReviewPage = (p) => {
    const next = Math.max(0, Math.min(totalPages - 1, p));
    setReviewPage(next);
    loadReviews(next, reviewSize);
    window.scrollTo({ top: document.getElementById("reviews-section")?.offsetTop ?? 0, behavior: "smooth" });
  };

  // 숫자 버튼(최대 5개 블록)
  const blockSize = 5;
  const currentBlock = Math.floor(number / blockSize);
  const startPage = currentBlock * blockSize;
  const endPage = Math.min(startPage + blockSize - 1, totalPages - 1);

  return (
    <div className="container py-4" style={{ maxWidth: 1160 }}>
      <nav className="mdp-breadcrumb">
        <button className="text-link" onClick={() => navigate(location.state?.from || "/")}>Home</button>
        <span>/</span><span className="fw-semibold">상품</span>
      </nav>

      <div className="mdp-grid no-thumbs">
        {/* 좌측 이미지 */}
        <div className="mdp-main">
          {images.length > 1 && (
            <button className="mdp-arrow left" onClick={() => go(-1)} aria-label="이전">‹</button>
          )}
          <img src={images[idx]} alt={menu.menuName} />
          {images.length > 1 && (
            <button className="mdp-arrow right" onClick={() => go(+1)} aria-label="다음">›</button>
          )}
        </div>

        {/* 우측 정보 */}
        <div className="mdp-info">
          <div className="mdp-rating">
            <span className="star-icon" aria-hidden="true" />
            <span className="score">{avgRating != null ? avgRating.toFixed(1) : "–"}</span>
            <button className="link" onClick={() => document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" })}>
              리뷰 {reviewCount.toLocaleString()}건
            </button>
          </div>

          <h2 className="mdp-title">{menu.menuName}</h2>

          <div className="mdp-price">
            {discount > 0 && <span className="discount">{discount}%</span>}
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
              <dd>
                <button className="link" onClick={() => setOpenInstallment(true)}>
                  카드 자세히 보기
                </button>
              </dd>
            </div>
          </dl>

          <div className="mdp-controls">
            <div className="qty">
              <label>수량</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>

          <div className="mdp-actions">
            <AddToCartButton menuId={menu.menuId} quantity={qty} />
            <button className="btn-buy" onClick={() => alert("구매 플로우는 결제 연동 후 구현 예정입니다.")}>
              구매하기
            </button>
          </div>

          <div className="mdp-total">
            총 구매 금액 <strong>{(price * qty).toLocaleString()}원</strong>
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

          {/* 페이지당 개수 선택(선택) */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">페이지당</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 80 }}
              value={reviewSize}
              onChange={(e) => {
                const s = Number(e.target.value) || 5;
                setReviewSize(s);
                setReviewPage(0);
                loadReviews(0, s);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>

        <div className="list-group mt-3 mb-3">
          {reviews.length === 0 && (
            <div className="text-muted">아직 리뷰가 없습니다.</div>
          )}
          {reviews.map(rv => (
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

        {/* 페이지네이션 */}
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-primary" disabled={first} onClick={() => goReviewPage(0)}>
            &laquo;
          </button>
          <button className="btn btn-outline-primary" disabled={number === 0} onClick={() => goReviewPage(number - 1)}>
            &lt;
          </button>

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
            const p = startPage + i;
            return (
              <button
                key={p}
                className={`btn ${p === number ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => goReviewPage(p)}
              >
                {p + 1}
              </button>
            );
          })}

          <button
            className="btn btn-outline-primary"
            disabled={number >= totalPages - 1}
            onClick={() => goReviewPage(number + 1)}
          >
            &gt;
          </button>
          <button
            className="btn btn-outline-primary"
            disabled={last}
            onClick={() => goReviewPage(totalPages - 1)}
          >
            &raquo;
          </button>
        </div>

        {/* 작성 폼: 성공 시 첫 페이지 재조회 */}
        {/* <div className="mt-3">
          <ReviewForm
            menuId={menu?.menuId}
            onSuccess={() => {
              loadSummary();
              setReviewPage(0);
              loadReviews(0, reviewSize);
            }}
          />
        </div> */}
      </section>

      <InstallmentInfo open={openInstallment} onClose={() => setOpenInstallment(false)} />
    </div>
  );
}