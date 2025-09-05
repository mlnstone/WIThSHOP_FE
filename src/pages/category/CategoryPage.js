// src/pages/CategoryPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link, useLocation } from "react-router-dom";
import MenuGrid from "../../components/menu/MenuGrid";
import Pagination from "../../components/common/Pagination"; // ✅ 추가

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useLocation();

  const [pageData, setPageData] = useState(null);
  const [categoryName, setCategoryName] = useState(state?.categoryName || "");
  const [loading, setLoading] = useState(true);

  const page = useMemo(() => Number(searchParams.get("page") || 0), [searchParams]);

  useEffect(() => {
    if (categoryName) return;
    fetch(`/categories/${categoryId}`)
      .then(async (res) => {
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { return null; }
      })
      .then((dto) => { if (dto?.categoryName) setCategoryName(dto.categoryName); })
      .catch(() => { });
  }, [categoryId, categoryName]);

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

  if (loading) return <div className="container py-4">불러오는 중...</div>;
  if (!pageData) return <div className="container py-4">목록을 불러오지 못했습니다.</div>;

  const { content = [], number = 0, totalPages = 1 } = pageData;

  // 페이지 변경 핸들러 (다른 쿼리 유지하려면 필요시 추가로 병합)
  const goPage = (p) => setSearchParams({ page: String(p) });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">{categoryName || `카테고리 #${categoryId}`}</h3>
        <Link to="/" className="btn btn-outline-secondary btn-sm">← 홈</Link>
      </div>

      <MenuGrid items={content} />

      {/* 페이지네이션 */}

      <Pagination
        page={number}
        totalPages={totalPages}
        blockSize={5}
        onChange={goPage}
        variant="dark"     // 'dark' | 'primary' | 'gray'
        size="sm"
        className="mt-4"
      />
    </div>
  );
}