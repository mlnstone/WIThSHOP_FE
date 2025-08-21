import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function BoardDetailPage() {
  const { boardId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/board/${boardId}`)
      .then(async (res) => {
        const txt = await res.text();
        try { return JSON.parse(txt); } catch { throw new Error("Invalid JSON"); }
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [boardId]);

  if (loading) return <div className="container py-4">불러오는 중…</div>;
  if (!data) return <div className="container py-4">게시글을 불러오지 못했습니다.</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-2">
        <h3 className="m-0">{data.boardTitle}</h3>
        <Link to="/board" className="btn btn-outline-secondary btn-sm">← 목록</Link>
      </div>
      <div className="text-muted small mb-3">
  {data.boardTypeTitle} · 조회수 {data.hit ?? 0} · {data.createdAt 
    ? data.createdAt.replace("T", " ").slice(0, 16) 
    : ""}
</div>
      <div className="border rounded p-3" style={{ whiteSpace: "pre-wrap" }}>
        {data.boardContent}
      </div>
    </div>
  );
}