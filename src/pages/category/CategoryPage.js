// src/pages/CategoryPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link, useLocation } from "react-router-dom";
import MenuGrid from "../../components/menu/MenuGrid";

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useLocation(); // Header에서 { state: { categoryName } }로 넘어올 수 있음

  const [pageData, setPageData] = useState(null);
  const [categoryName, setCategoryName] = useState(state?.categoryName || "");
  const [loading, setLoading] = useState(true);

  // 0-base page param
  const page = useMemo(() => Number(searchParams.get("page") || 0), [searchParams]);

  // 헤더에서 이름이 안 넘어온 경우 1회 조회
  useEffect(() => {
    if (categoryName) return;
    fetch(`/categories/${categoryId}`)
      .then(async (res) => {
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { return null; }
      })
      .then((dto) => {
        if (dto?.categoryName) setCategoryName(dto.categoryName);
      })
      .catch(() => { /* 무시 */ });
  }, [categoryId, categoryName]);

  // 해당 카테고리의 메뉴 목록(12개씩) 조회
  useEffect(() => {
    setLoading(true);
    fetch(`/categories/${categoryId}/menus?page=${page}&size=12`)
      .then(async (res) => {
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { throw new Error("Invalid JSON"); }
      })
      .then(setPageData)
      .catch(() => setPageData(null))
      .finally(() => setLoading(false));
  }, [categoryId, page]);

  if (loading) return <div className="container py-4">불러오는 중…</div>;
  if (!pageData) return <div className="container py-4">목록을 불러오지 못했습니다.</div>;

  const {
    content = [],
    number = 0,        // 현재 페이지(0-base)
    totalPages = 1,    // 총 페이지 수
    first = true,      // 첫 페이지 여부
    last = true        // 마지막 페이지 여부
  } = pageData;

  const goPage = (p) => setSearchParams({ page: String(p) });

  // --- 블록 네비게이션(5개 단위) ---
  const blockSize = 5;
  const currentBlock = Math.floor(number / blockSize);
  const startPage = currentBlock * blockSize;
  const endPage = Math.min(startPage + blockSize - 1, totalPages - 1);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">{categoryName || `카테고리 #${categoryId}`}</h3>
        <Link to="/" className="btn btn-outline-secondary btn-sm">← 홈</Link>
      </div>

      <MenuGrid items={content} />

      {/* 페이지네이션 */}
      <div className="d-flex gap-2 justify-content-center mt-4">
        {/* 맨 앞으로 */}
        <button
          className="btn btn-outline-primary"
          disabled={first}
          onClick={() => goPage(0)}
        >
          &laquo;
        </button>

        {/* 이전 블록 */}
        <button
          className="btn btn-outline-primary"
          disabled={startPage === 0}
          onClick={() => goPage(Math.max(0, startPage - 1))}
        >
          &lt;
        </button>

        {/* 현재 블록의 페이지들 */}
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
          const p = startPage + i;
          return (
            <button
              key={p}
              className={`btn ${p === number ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => goPage(p)}
            >
              {p + 1}
            </button>
          );
        })}

        {/* 다음 블록 */}
        <button
          className="btn btn-outline-primary"
          disabled={endPage >= totalPages - 1}
          onClick={() => goPage(Math.min(totalPages - 1, endPage + 1))}
        >
          &gt;
        </button>

        {/* 맨 뒤로 */}
        <button
          className="btn btn-outline-primary"
          disabled={last}
          onClick={() => goPage(totalPages - 1)}
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}