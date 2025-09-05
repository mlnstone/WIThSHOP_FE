// src/pages/board/BoardListPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "../../components/common/Pagination";

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
  const typeId = searchParams.get("typeId") || "";                 // 선택된 게시판 타입 id
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

  const authHeaders = () => {
    const t = localStorage.getItem("accessToken");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // 내 정보
  useEffect(() => {
    fetch("/api", { headers: { Accept: "application/json", ...authHeaders() } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMe)
      .catch(() => setMe(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 게시판 타입 목록
  useEffect(() => {
    fetch("/board-types")
      .then((r) => r.text())
      .then((t) => { try { return JSON.parse(t); } catch { return []; } })
      .then((list) => Array.isArray(list) ? setBoardTypes(list) : setBoardTypes([]))
      .catch(() => setBoardTypes([]));
  }, []);

  // 목록
  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({
      page, size,
      sort: `createdAt,${sort}`,
      ...(search ? { search } : {}),
      ...(typeId ? { typeId } : {}),
    });
    fetch(`/board?${qs.toString()}`)
      .then((r) => r.text())
      .then((t) => { try { return JSON.parse(t); } catch { throw new Error("Invalid JSON"); } })
      .then(setPageData)
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
  if (loading) return <div className="container-xxl py-5 text-center">불러오는 중…</div>;
  if (!pageData) return <div className="container-xxl py-5 text-center">목록을 불러오지 못했습니다.</div>;

  const { content = [], number = 0, totalPages = 1 } = pageData;
  const rowNoBase = number * size;
  const fmtDate = (dt) => (dt ? dt.replace("T", " ").slice(0, 10) : "");
  const writeLink = typeId ? `/board/new?typeId=${typeId}` : "/board/new";

  return (
    <div className="container-xxl py-5" style={{ maxWidth: 1280 }}>
      {/* 좌/우 테이블 보더 제거용 스타일 주입 (위/아래는 유지) */}
      <style>{
        `
        .board-table>:not(caption)>*>* {
          border-left: 0 !important;
          border-right: 0 !important;
        }
        .border-x-0 {
          border-left: 0 !important;
          border-right: 0 !important;
        }
      `
      }
      </style>


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
        {/* 전체 버튼 – typeId 해제 */}
        <button
          type="button"
          aria-pressed={!typeId}
          className={`btn btn-sm rounded-pill px-4 ${!typeId ? "btn-dark" : "btn-outline-dark"}`}
          onClick={() =>
            setSearchParams({
              page: "0",
              sort,
              ...(search ? { search } : {}), // 검색어는 유지
              // ⛔ typeId는 의도적으로 넣지 않음 → 전체 보기
            })
          }
        >
          전체
        </button>

        {/* 각 게시판 타입 버튼 */}
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
        {/* 회색 계열 버튼 */}
        <button className="btn btn-outline-secondary btn-sm">검색</button>
      </form>

      {/* 표 */}
      <div className="card border-x-0 shadow-none" style={{ borderRadius: 0 }}>
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
                      <Link
                        to={`/board/${b.boardId}`}
                        className="text-decoration-none text-dark fw-semibold"
                      >
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

      {/* 페이지네이션 – 공용 컴포넌트 사용 */}
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