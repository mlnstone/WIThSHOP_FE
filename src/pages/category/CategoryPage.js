// src/pages/CategoryPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link, useLocation } from "react-router-dom";
import MenuGrid from "../../components/menu/MenuGrid";
import Pagination from "../../components/common/Pagination";
import { apiFetch } from "../../services/api"; 

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useLocation();

  const [pageData, setPageData] = useState(null);
  const [categoryName, setCategoryName] = useState(state?.categoryName || "");
  const [loading, setLoading] = useState(true);

  const page = useMemo(() => Number(searchParams.get("page") || 0), [searchParams]);

  // 카테고리 이름 조회
  useEffect(() => {
    if (categoryName) return;
    apiFetch(`/categories/${categoryId}`)
      .then(({ ok, data }) => {
        if (ok && data?.categoryName) setCategoryName(data.categoryName);
      })
      .catch(() => {});
  }, [categoryId, categoryName]);

  // 카테고리별 메뉴 목록 조회
  useEffect(() => {
    setLoading(true);
    apiFetch(`/categories/${categoryId}/menus?page=${page}&size=12`)
      .then(({ ok, data }) => setPageData(ok ? data : null))
      .catch(() => setPageData(null))
      .finally(() => setLoading(false));
  }, [categoryId, page]);

  if (loading) return <div className="container py-4">불러오는 중...</div>;
  if (!pageData) return <div className="container py-4">목록을 불러오지 못했습니다.</div>;

  const { content = [], number = 0, totalPages = 1 } = pageData;

  // 페이지 변경 핸들러
  const goPage = (p) => setSearchParams({ page: String(p) });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">{categoryName || `카테고리 #${categoryId}`}</h3>
        <Link to="/" className="btn btn-outline-secondary btn-sm">← 홈</Link>
      </div>

      <MenuGrid items={content} />

      <Pagination
        page={number}
        totalPages={totalPages}
        blockSize={5}
        onChange={goPage}
        variant="dark"
        size="sm"
        className="mt-4"
      />
    </div>
  );
}