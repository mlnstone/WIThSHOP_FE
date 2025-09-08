// src/pages/board/BoardListPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "../../components/common/Pagination";
import { apiFetch } from "../../services/api";

export default function BoardListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 데이터 상태
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [boardTypes, setBoardTypes] = useState([]);

  // 쿼리
  const page = useMemo(() => Number(searchParams.get("page") || 0), [searchParams]);
  const search = searchParams.get("search") || "";
  const typeId = searchParams.get("typeId") || "";
  const sort = (searchParams.get("sort") || "desc").toLowerCase(); // desc | asc
  const size = 10;

  // 현재 선택된 타입
  const currentType = useMemo(() => {
    const idStr = String(typeId || "");
    return boardTypes.find(
      (t) => String(t.boardTypeId) === idStr || String(t.code) === idStr
    );
  }, [boardTypes, typeId]);

  // 화면 타이틀
  const title = currentType?.boardTypeName ?? currentType?.name ?? "게시판";

  // 내 정보
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    apiFetch("/api", {
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then(({ ok, data }) => setMe(ok ? data : null))
      .catch(() => setMe(null));
  }, []);

  // 게시판 타입 목록
  useEffect(() => {
    apiFetch("/board-types")
      .then(({ ok, data }) => setBoardTypes(ok && Array.isArray(data) ? data : []))
      .catch(() => setBoardTypes([]));
  }, []);

  // 목록
  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({
      page,
      size,
      sort: `createdAt,${sort}`,
      ...(search ? { search } : {}),
      ...(typeId ? { typeId } : {}),
    });
    apiFetch(`/board?${qs.toString()}`)
      .then(({ ok, data }) => setPageData(ok ? data : null))
      .catch(() => setPageData(null))
      .finally(() => setLoading(false));
  }, [page, search, typeId, sort]);

  // helpers
  const setParams = (over = {}) => {
    setSearchParams({
      page: String(over.page ?? page),
      ...(search ? { search } : {}),
      ...(typeId ? { typeId } : {}),
      sort: over.sort ?? sort,
    });
  };
  const goPage = (p) => setParams({ page: p });

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const v = e.currentTarget.search.value.trim();
    setSearchParams({
      page: "0",
      ...(v ? { search: v } : {}),
      ...(typeId ? { typeId } : {}),
      sort,
    });
  };

  // 렌더 준비
  if (loading) return <div className="container-xxl py-4">불러오는 중...</div>;
  if (!pageData) return <div className="container-xxl py-4">목록을 불러오지 못했습니다.</div>;

  const { content = [], number = 0, totalPages = 1 } = pageData;
  const rowNoBase = number * size;
  const fmtDate = (dt) => (dt ? dt.replace("T", " ").slice(0, 10) : "");
  const writeLink = typeId ? `/board/new?typeId=${typeId}` : "/board/new";

  return (
    <div className="container-xxl py-5" style={{ maxWidth: 1280 }}>
      <style>{`
        .board-table>:not(caption)>*>* { border-left: 0 !important; border-right: 0 !important; }
        .border-x-0 { border-left: 0 !important; border-right: 0 !important; }
      `}</style>

      {/* breadcrumb */}
      <div className="d-flex justify-content-end small mb-2">
        <Link to="/" className="text-muted text-decoration-none">Home</Link>
        <span className="mx-1">/</span>
        <strong className="ms-1 text-dark">{title}</strong>
      </div>

      {/* 타이틀 */}
      <h2 className="text-center fw-bold mb-4">{title}</h2>

      {/* 타입 탭 */}
      <div className="d-flex justify-content-center gap-2 flex-wrap mb-4">
        {/* 전체 */}
        <button
          type="button"
          aria-pressed={!typeId}
          className={`btn btn-sm rounded-pill px-4 ${!typeId ? "btn-dark" : "btn-outline-dark"}`}
          onClick={() =>
            setSearchParams({
              page: "0",
              sort,
              ...(search ? { search } : {}),
            })
          }
        >
          전체
        </button>

        {boardTypes.map((bt) => {
          const id = String(bt.boardTypeId);
          const name = bt.boardTypeName ?? bt.name ?? id;
          const active = String(typeId || "") === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              className={`btn btn-sm rounded-pill px-4 ${active ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() =>
                setSearchParams({
                  page: "0",
                  sort,
                  ...(search ? { search } : {}),
                  typeId: id,
                })
              }
            >
              {name}
            </button>
          );
        })}

        {me?.role === "ADMIN" && (
          <Link to={writeLink} className="btn btn-success btn-sm rounded-pill px-4 ms-2">
            글쓰기
          </Link>
        )}
      </div>

      {/* 검색 */}
      <form className="d-flex gap-2 mb-3 justify-content-end" onSubmit={onSubmitSearch}>
        <input
          name="search"
          className="form-control form-control-sm"
          style={{ maxWidth: 260 }}
          placeholder="검색어"
          defaultValue={search}
        />
        <button className="btn btn-outline-secondary btn-sm">검색</button>
      </form>

      {/* 데스크탑 테이블 */}
      <div className="card border-x-0 shadow-none d-none d-sm-block" style={{ borderRadius: 0 }}>
        <div className="table-responsive">
          <table className="table mb-0 align-middle board-table" style={{ minWidth: 920 }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: 110 }} className="text-center">번호</th>
                <th className="text-center">제목</th>
                <th style={{ width: 180 }} className="text-center">작성자</th>
                <th style={{ width: 160 }} className="text-center">작성일</th>
                <th style={{ width: 120 }} className="text-center">조회</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {content.map((b, idx) => {
                const no = rowNoBase + idx + 1;
                const writer = b.writerName || b.username || b.authorName || b.createdBy || "운영자";
                return (
                  <tr key={b.boardId} className="bg-white">
                    <td className="text-center">{no}</td>
                    <td className="text-center">
                      <Link to={`/board/${b.boardId}`} className="text-decoration-none text-dark fw-semibold">
                        {b.boardTitle}
                      </Link>
                    </td>
                    <td className="text-center text-muted small">{writer}</td>
                    <td className="text-center text-muted small">{fmtDate(b.createdAt)}</td>
                    <td className="text-center text-muted small">{b.hit ?? 0}</td>
                  </tr>
                );
              })}
              {content.length === 0 && (
                <tr className="bg-white">
                  <td colSpan={5} className="text-center py-5 text-muted">게시글이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일 리스트 */}
      <div className="d-sm-none">
        <style>{`.line-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}`}</style>
        <ul className="list-group list-group-flush bg-white rounded-3 overflow-hidden">
          {content.map((b) => {
            const writer = b.writerName || b.username || b.authorName || b.createdBy || "운영자";
            return (
              <li key={b.boardId} className="list-group-item px-3">
                <Link to={`/board/${b.boardId}`} className="d-block text-dark fw-semibold text-decoration-none line-2">
                  {b.boardTitle}
                </Link>
                <div className="text-muted small mt-1 d-flex flex-wrap gap-1">
                  <span>{writer}</span>
                  <span className="px-1">·</span>
                  <span>{fmtDate(b.createdAt)}</span>
                  <span className="px-1">·</span>
                  <span>조회 {b.hit ?? 0}</span>
                </div>
              </li>
            );
          })}
          {content.length === 0 && (
            <li className="list-group-item text-center text-muted py-4">게시글이 없습니다.</li>
          )}
        </ul>
      </div>

      {/* 페이지네이션 */}
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