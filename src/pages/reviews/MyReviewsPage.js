// src/pages/reviews/MyReviewsPage.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MySidebar from "../../components/me/Sidebar";
import Pagination from "../../components/common/Pagination";
import { authHeaders } from "../../services/api";

export default function MyReviewsPage() {
  const [sp, setSp] = useSearchParams();
  const page = useMemo(() => Number(sp.get("page") || 0), [sp]);
  const size = 10;

  const MAX_TITLE = 255;
  const MAX_CONTENT = 2000; // UX 상한 (DB TEXT)
  const MAX_IMAGE = 512;    // 서버 허용 길이에 맞춤

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // 인라인 편집 상태
  const [editing, setEditing] = useState(null); // { reviewId, reviewTitle, reviewContent, rating, reviewImage }

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const qs = new URLSearchParams({ page, size, sort: "createdAt,desc" });
      const r = await fetch(`/me/reviews?${qs.toString()}`, { headers: authHeaders() });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setErr(j?.message || "리뷰를 불러오지 못했어요.");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setErr("네트워크 오류");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { (async () => { await fetchList(); })(); }, [fetchList]);

  const goPage = (p) => setSp({ page: String(p) });

  if (loading) return <div className="container py-4">불러오는 중...</div>;
  if (err) return <div className="container py-4">{err}</div>;
  if (!data) return null;

  const { content = [], number = 0, totalPages = 1 } = data;
  const rowNoBase = number * size;
  const fmt = (dt) => (dt ? dt.replace("T", " ").slice(0, 16) : "-");

  // ⭐ 별 렌더링 (정수)
  const renderStars = (rating) => {
    const n = Math.max(0, Math.min(5, Math.floor(rating || 0)));
    return (
      <div className="d-flex gap-1" aria-label={`평점 ${n}점`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`star-icon ${i < n ? "" : "empty"}`} aria-hidden="true" />
        ))}
      </div>
    );
  };

  // ⏱ 작성 3일 이내만 수정/삭제 허용
  const canEditOrDelete = (createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const threeDaysAfter = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
    return new Date() <= threeDaysAfter;
  };

  // 인라인 수정 열기/닫기
  const openEditor = (rv) => {
    setEditing({
      reviewId: rv.reviewId,
      reviewTitle: rv.reviewTitle ?? "",
      reviewContent: rv.reviewContent ?? "",
      rating: Math.max(1, Math.min(5, Math.floor(rv.rating ?? 5))),
      reviewImage: rv.reviewImage ?? "",
    });
  };
  const closeEditor = () => setEditing(null);

  // 저장
  const saveEditing = async () => {
    if (!editing) return;
    const { reviewId, reviewTitle, reviewContent, rating, reviewImage } = editing;

    if (!reviewTitle.trim() || !reviewContent.trim()) {
      alert("제목/내용을 입력하세요.");
      return;
    }
    if (reviewTitle.length > MAX_TITLE) {
      alert(`제목은 최대 ${MAX_TITLE}자까지 가능합니다.`);
      return;
    }
    if (reviewContent.length > MAX_CONTENT) {
      alert(`내용은 최대 ${MAX_CONTENT}자까지 가능합니다.`);
      return;
    }
    if (reviewImage && reviewImage.length > MAX_IMAGE) {
      alert(`이미지 URL은 최대 ${MAX_IMAGE}자까지 가능합니다.`);
      return;
    }
    if (!(Number.isInteger(Number(rating)) && rating >= 1 && rating <= 5)) {
      alert("평점은 1~5 정수만 가능합니다.");
      return;
    }

    try {
      const r = await fetch(`/me/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewTitle,
          reviewContent,
          rating: Number(rating),
          reviewImage: reviewImage || null,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        alert(j?.message || "수정에 실패했습니다.");
        return;
      }
      alert("수정되었습니다.");
      setEditing(null);
      fetchList();
    } catch {
      alert("네트워크 오류");
    }
  };

  // 삭제
  const onDelete = async (rv) => {
    if (!canEditOrDelete(rv.createdAt)) {
      alert("리뷰는 작성 후 3일 이내에만 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const r = await fetch(`/me/reviews/${rv.reviewId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        alert(j?.message || "삭제에 실패했습니다.");
        return;
      }
      alert("삭제되었습니다.");
      setEditing(null);
      fetchList();
    } catch {
      alert("네트워크 오류");
    }
  };

  return (
    <div className="container py-4">
      <div className="row g-3">
        <div className="col-12 col-md-2"><MySidebar /></div>

        <div className="col-12 col-md-10">
          <h3 className="mb-3">내 리뷰</h3>

          <div className="card">
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <tbody>
                  {content.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4">작성한 리뷰가 없어요.</td>
                    </tr>
                  )}

                  {content.map((rv, idx) => {
                    const editable = canEditOrDelete(rv.createdAt);
                    const isEditingThis = editing?.reviewId === rv.reviewId;

                    return (
                      <React.Fragment key={rv.reviewId}>
                        {/* 1행: 번호(rowspan=3) / 이미지 / 메뉴명 / 평점 / 작성일 / 액션 */}
                        <tr key={`${rv.reviewId}-head`}>
                          {/* 번호: 3행 통합 */}
                          <td rowSpan={3} style={{ width: 70 }} className="text-center align-top">
                            {rowNoBase + idx + 1}
                          </td>

                          {/* 이미지 */}
                          <td style={{ width: 72 }} className="text-center">
                            <Link to={`/menus/${rv.menuId}#reviews`} style={{ display: "inline-block" }}>
                              <img
                                src={"https://i.ytimg.com/vi/t8UsvudgrsU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBgu2YR5QQC4RARzLk9XC-jnlYfGw"}
                                alt="리뷰이미지"
                                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}
                                onError={(e) => (e.currentTarget.src = "/noimage.png")}
                              />
                            </Link>
                          </td>

                          {/* 메뉴명 */}
                          <td className="text-center">
                            <div className="fw-semibold">
                              <Link to={`/menus/${rv.menuId}`}>{rv.menuName}</Link>
                            </div>
                          </td>

                          {/* 평점 */}
                          <td style={{ width: 150 }} className="text-center">
                            {renderStars(rv.rating)}
                          </td>

                          {/* 작성일 */}
                          <td style={{ width: 180 }} className="text-center">
                            {fmt(rv.createdAt)}
                          </td>

                          {/* 액션: 수정(파랑) / 삭제(빨강) */}
                          <td style={{ width: 160 }} className="text-end">
                            <div className="d-inline-flex align-items-center gap-3">
                              <button
                                type="button"
                                className="action-link text-primary"
                                onClick={() => openEditor(rv)}
                                disabled={!editable}
                                title={editable ? "수정" : "작성 3일 이후 수정 불가"}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                className="action-link text-danger"
                                onClick={() => onDelete(rv)}
                                disabled={!editable}
                                title={editable ? "삭제" : "작성 3일 이후 삭제 불가"}
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* 2행: 제목 (번호 셀을 이미 사용하므로 colSpan=5) */}
                        <tr key={`${rv.reviewId}-title`}>
                          <td colSpan={5} className="py-2">
                            <span className="text-dark fw-semibold me-2">제목</span>
                            <span className="text-muted">{rv.reviewTitle || "-"}</span>
                          </td>
                        </tr>

                        {/* 3행: 내용 (colSpan=5) */}
                        <tr key={`${rv.reviewId}-body`} className={!isEditingThis ? "border-bottom" : ""}>
                          <td colSpan={5} className="py-2">
                            <span className="text-dark fw-semibold me-2">내용</span>
                            <span className="text-break">{rv.reviewContent || "-"}</span>
                          </td>
                        </tr>

                        {/* 인라인 편집 행 (번호 셀 rowSpan은 3까지만이라, 에디터는 전체 6칸 사용) */}
                        {isEditingThis && (
                          <tr key={`editor-${rv.reviewId}`}>
                            <td colSpan={6} className="bg-light">
                              <div className="position-relative p-3 border rounded bg-white">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary position-absolute"
                                  style={{ top: 8, right: 8 }}
                                  onClick={closeEditor}
                                  aria-label="닫기"
                                  title="닫기"
                                >
                                  ×
                                </button>

                                <div className="row g-3">
                                  {/* 제목 */}
                                  <div className="col-12">
                                    <label className="form-label">제목</label>
                                    <input
                                      className="form-control w-100"
                                      value={editing.reviewTitle}
                                      onChange={(e) =>
                                        setEditing((st) => ({ ...st, reviewTitle: e.target.value }))
                                      }
                                      placeholder="리뷰 제목"
                                      maxLength={MAX_TITLE}
                                      autoFocus
                                    />
                                    <div className="text-end small text-muted mt-1">
                                      {editing.reviewTitle.length}/{MAX_TITLE}
                                    </div>
                                  </div>

                                  {/* 내용 */}
                                  <div className="col-12">
                                    <label className="form-label">내용</label>
                                    <textarea
                                      className="form-control w-100"
                                      rows={4}
                                      value={editing.reviewContent}
                                      onChange={(e) =>
                                        setEditing((st) => ({ ...st, reviewContent: e.target.value }))
                                      }
                                      placeholder="내용을 입력해 주세요"
                                      maxLength={MAX_CONTENT}
                                    />
                                    <div className="text-end small text-muted mt-1">
                                      {editing.reviewContent.length}/{MAX_CONTENT}
                                    </div>
                                  </div>

                                  {/* 이미지 URL */}
                                  <div className="col-12 col-md-6">
                                    <label className="form-label">이미지 URL</label>
                                    <input
                                      className="form-control"
                                      value={editing.reviewImage}
                                      onChange={(e) =>
                                        setEditing((st) => ({ ...st, reviewImage: e.target.value }))
                                      }
                                      placeholder="https://example.com/image.jpg"
                                      maxLength={MAX_IMAGE}
                                    />
                                    <div className="text-end small text-muted mt-1">
                                      {(editing.reviewImage ?? "").length}/{MAX_IMAGE}
                                    </div>
                                  </div>

                                  {/* 평점 */}
                                  <div className="col-12">
                                    <label className="form-label d-block">평점</label>
                                    <div className="d-flex align-items-center gap-2">
                                      {[1, 2, 3, 4, 5].map((n) => (
                                        <span
                                          key={n}
                                          role="radio"
                                          aria-checked={editing.rating === n}
                                          tabIndex={0}
                                          className={`star ${editing.rating >= n ? "active" : ""}`}
                                          onClick={() =>
                                            setEditing((st) => ({ ...st, rating: n }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ")
                                              setEditing((st) => ({ ...st, rating: n }));
                                          }}
                                          title={`${n}점`}
                                          style={{ cursor: "pointer", fontSize: 22, lineHeight: 1 }}
                                        >
                                          ★
                                        </span>
                                      ))}
                                      <span className="small text-muted">{editing.rating} / 5</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 d-flex justify-content-end gap-2">
                                  <button className="btn btn-outline-secondary" onClick={closeEditor}>취소</button>
                                  <button className="btn btn-dark" onClick={saveEditing}>저장</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

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
      </div>
    </div>
  );
}