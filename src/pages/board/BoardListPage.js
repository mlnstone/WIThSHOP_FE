// src/pages/BoardListPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function BoardListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✨ 추가: 로그인 사용자 정보
  const [me, setMe] = useState(null);

  // 쿼리
  const page = useMemo(() => Number(searchParams.get("page") || 0), [searchParams]); // 0-base
  const search = searchParams.get("search") || "";
  const typeId = searchParams.get("typeId") || "";
  const sort = (searchParams.get("sort") || "desc").toLowerCase(); // desc(최신순) | asc(오래된순)

  // 제목용: 보드 타입 이름
  const [boardTypeName, setBoardTypeName] = useState("게시판");

  // ✨ 추가: 토큰 헤더 헬퍼
  const authHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ✨ 추가: 내 정보 로드 (/api)
  useEffect(() => {
    fetch("/api", { headers: { Accept: "application/json", ...authHeaders() } })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauth");
        return res.json();
      })
      .then(setMe)
      .catch(() => setMe(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 1회

  // 타입 이름 가져오기 (단건 API가 없으면 리스트에서 찾아 사용)
  useEffect(() => {
    if (!typeId) {
      setBoardTypeName("게시판");
      return;
    }
    fetch("/board-types")
      .then(async (res) => {
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { return []; }
      })
      .then((list) => {
        const found = Array.isArray(list)
          ? list.find((t) => String(t.boardTypeId) === String(typeId))
          : null;
        setBoardTypeName(found?.boardTypeName ?? found?.name ?? "게시판");
      })
      .catch(() => setBoardTypeName("게시판"));
  }, [typeId]);

  // 목록 데이터
  useEffect(() => {
    setLoading(true);

    const qs = new URLSearchParams({
      page,
      size: 10,
      sort: `createdAt,${sort}`,
      ...(search ? { search } : {}),
      ...(typeId ? { typeId } : {}),
    });

    fetch(`/board?${qs.toString()}`)
      .then(async (res) => {
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { throw new Error("Invalid JSON"); }
      })
      .then(setPageData)
      .catch(() => setPageData(null))
      .finally(() => setLoading(false));
  }, [page, search, typeId, sort]);

  const setParams = (overrides) => {
    setSearchParams({
      page: String(overrides.page ?? page),
      ...(search ? { search } : {}),
      ...(typeId ? { typeId } : {}),
      sort,
      ...("sort" in overrides ? { sort: overrides.sort } : {}),
    });
  };

  const goPage = (p) => setParams({ page: p });

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input[name=search]");
    setSearchParams({
      page: "0",
      ...(input.value ? { search: input.value } : {}),
      ...(typeId ? { typeId } : {}),
      sort,
    });
  };

  const setSortOrder = (order) => {
    setSearchParams({
      page: "0",
      ...(search ? { search } : {}),
      ...(typeId ? { typeId } : {}),
      sort: order,
    });
  };

  if (loading) return <div className="container py-4">불러오는 중…</div>;
  if (!pageData) return <div className="container py-4">목록을 불러오지 못했습니다.</div>;

  const {
    content = [],
    number = 0,
    totalPages = 1,
    first = true,
    last = true,
  } = pageData;

  const blockSize = 5;
  const currentBlock = Math.floor(number / blockSize);
  const startPage = currentBlock * blockSize;
  const endPage = Math.min(startPage + blockSize - 1, totalPages - 1);

  // ✨ 글쓰기 링크 (typeId 유지)
  const writeLink = typeId ? `/board/new?typeId=${typeId}` : "/board/new";

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">{boardTypeName}</h3>

        <div className="d-flex gap-2">
          {/* 정렬 버튼 */}
          <button
            className={`btn ${sort === "desc" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSortOrder("desc")}
          >
            최신순
          </button>
          <button
            className={`btn ${sort === "asc" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSortOrder("asc")}
          >
            오래된순
          </button>

          {/* ✨ 관리자 전용 글쓰기 버튼 */}
          {me?.role === "ADMIN" && (
            <Link to={writeLink} className="btn btn-success">
              글쓰기
            </Link>
          )}
        </div>
      </div>

      {/* 검색 */}
      <form
        className="d-flex gap-2 mb-3 justify-content-end"
        onSubmit={onSubmitSearch}
      >
        <input
          name="search"
          className="form-control form-control-sm w-auto"
          style={{ maxWidth: "200px" }}
          placeholder="검색어"
          defaultValue={search}
        />
        <button className="btn btn-outline-primary btn-sm">검색</button>
      </form>

      {/* 목록 */}
      <div className="list-group">
        {content.map((b) => (
          <Link
            key={b.boardId}
            to={`/board/${b.boardId}`}
            className="list-group-item list-group-item-action"
          >
            <div className="d-flex justify-content-between">
              <strong>{b.boardTitle}</strong>
              <small className="text-muted">
                {b.createdAt ? b.createdAt.replace("T", " ").slice(0, 16) : ""}
              </small>
            </div>
            <div className="text-muted small">
              {b.boardTypeTitle} · 조회수 {b.hit ?? 0}
            </div>
          </Link>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="d-flex gap-2 justify-content-center mt-4">
        <button className="btn btn-outline-primary" disabled={first} onClick={() => goPage(0)}>
          &laquo;
        </button>
        <button
          className="btn btn-outline-primary"
          disabled={startPage === 0}
          onClick={() => goPage(Math.max(0, startPage - 1))}
        >
          &lt;
        </button>
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
        <button
          className="btn btn-outline-primary"
          disabled={endPage >= totalPages - 1}
          onClick={() => goPage(Math.min(totalPages - 1, endPage + 1))}
        >
          &gt;
        </button>
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