// src/pages/BoardDetailPage.js (경로 예시)
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../services/api";

export default function BoardDetailPage() {
  const { boardId } = useParams();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // 필요 시 토큰 헤더
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const { ok, data } = await apiFetch(`/board/${boardId}`, { headers });
      if (!alive) return;

      if (!ok) {
        // 404 등 처리
        setData(null);
      } else {
        setData(data || null);
      }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [boardId]);

  if (loading) return <div className="container py-4">불러오는 중...</div>;
  if (!data)   return <div className="container py-4">게시글을 불러오지 못했습니다.</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-2">
        <h3 className="m-0">{data.boardTitle}</h3>
        <Link to="/board" className="btn btn-outline-secondary btn-sm">← 목록</Link>
      </div>

      {/* 타입 · 작성일 · 조회수 */}
      <div className="d-flex justify-content-between text-muted small mb-3">
        <div>
          {data.boardTypeTitle}
          {data.createdAt && <> · {data.createdAt.replace("T", " ").slice(0, 16)}</>}
        </div>
        <div>조회수 {data.hit ?? 0}</div>
      </div>

      <div className="border rounded p-3" style={{ whiteSpace: "pre-wrap" }}>
        {data.boardContent}
      </div>
    </div>
  );
}