// src/pages/category/BestByText.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../services/api";
import { matchCategoryIdByText } from "../../lib/nlp/categoryMatch";

const FALLBACK_IMG = "https://withshop.s3.ap-northeast-2.amazonaws.com/logo1.png";

function toImgUrl(src) {
  if (!src) return FALLBACK_IMG;
  if (/^https?:\/\//i.test(src)) return src;
  const base = process.env.REACT_APP_BACKEND ?? "";
  return `${base}/images/${src}`.replace(/([^:]\/)\/+/g, "$1");
}

export default function BestByText() {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState(null); // null: 아직 요청 안함
  const [loading, setLoading] = useState(false);

  // 1) 카테고리 1회 로드
  useEffect(() => {
    apiFetch("/categories").then((r) => { if (r.ok) setCats(r.data || []); });
  }, []);

  // 2) 랜덤 플레이스홀더 (페이지마다 바뀜)
  const [seed] = useState(() => Math.random());
  const rand = useMemo(() => {
    if (!cats?.length) return null;
    const idx = Math.floor(seed * cats.length) % cats.length;
    const c = cats[idx];
    const patterns = [
      (n) => `${n}에서 잘 팔리는거 추천`,
      (n) => `${n} 인기상품 추천`,
      (n) => `${n} 베스트 3개만`,
      (n) => `${n} 뭐가 제일 잘 나가?`,
    ];
    const p = patterns[Math.floor(seed * patterns.length) % patterns.length];
    return { id: c.categoryId, name: c.categoryName, placeholder: `예) ${p(c.categoryName)}` };
  }, [cats, seed]);

  // 3) 조회 (버튼/엔터로만 실행)
  const run = async () => {
    let catId = matchCategoryIdByText(q, cats);             // 자연어 매칭
    if (!catId) catId = rand?.id ?? (cats[0]?.categoryId || null); // 없으면 랜덤 카테고리
    if (!catId) { setItems([]); return; }

    setLoading(true);
    const r = await apiFetch(`/categories/${catId}/best?limit=3`);
    setItems(r.ok ? (r.data || []) : []);
    setLoading(false);
  };

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h3 className="mb-3">카테고리 베스트 추천</h3>

      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder={rand?.placeholder || "예) 타이어에서 잘 팔리는거 추천"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <button className="btn btn-dark" onClick={run}>추천받기</button>
      </div>

      {loading && <div>불러오는 중…</div>}

      {/* 아직 조회 안 했으면 아무 것도 안 보여줌 (items === null) */}
      {items !== null && !loading && items.length === 0 && (
        <div className="text-muted">아직 없습니다</div>
      )}

      {Array.isArray(items) && items.length > 0 && (
        <ul className="list-group">
          {items.map((it, idx) => (
            <li key={it.menuId} className="list-group-item">
              <div className="d-flex align-items-center gap-3">
                <div className="text-muted" style={{ width: 18 }}>{idx + 1}</div>

                <Link to={`/menus/${it.menuId}`} style={{ display: "inline-block" }}>
                  <img
                    src={toImgUrl(it.image)}
                    alt={it.menuName}
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                    style={{
                      width: 56, height: 56, objectFit: "cover",
                      borderRadius: 10, border: "1px solid #eee"
                    }}
                  />
                </Link>

                <div className="flex-grow-1 text-truncate fw-semibold" title={it.menuName}>
                  <Link to={`/menus/${it.menuId}`} className="text-decoration-none text-dark">
                    {it.menuName}
                  </Link>
                </div>

                <div className="ms-2 fw-bold" style={{ whiteSpace: "nowrap" }}>
                  {Number(it.salePrice).toLocaleString()}원
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}