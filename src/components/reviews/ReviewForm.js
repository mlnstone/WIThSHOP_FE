// src/components/review/ReviewForm.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ReviewForm({ menuId, orderCode, onSuccess }) {
  const [rating, setRating] = useState(5);    // 1~5 정수
  const [hover, setHover]   = useState(0);
  const [title, setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [image, setImage]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const authHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  };

  const ensureLogin = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", { replace: true, state: { from: location } });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureLogin()) return;

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }
    if (!(rating >= 1 && rating <= 5 && Number.isInteger(Number(rating)))) {
      alert("평점은 정수 1~5만 가능합니다.");
      return;
    }
    if (!orderCode) {
      alert("주문번호가 없습니다. 다시 시도해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/reviews", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          menuId,
          orderCode,                 // ✅ 서버로 주문번호 전달
          rating: Number(rating),
          reviewTitle: title,
          reviewContent: content,
          reviewImage: image || null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.message || data?.error || "리뷰 등록에 실패했습니다.");
        return;
      }

      setTitle("");
      setContent("");
      setImage("");
      setRating(5);
      onSuccess?.(data);
      alert("리뷰가 등록되었습니다.");
    } catch (err) {
      console.error(err);
      alert("네트워크 오류로 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 키보드 접근성
  const onKeyDownStar = (e, value) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setRating(value);
    }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setRating((r) => Math.min(5, r + 1));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setRating((r) => Math.max(1, r - 1));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded p-3">
      <h5 className="mb-3">리뷰 작성</h5>

      {/* 별점 */}
      <div className="mb-2">
        <label className="form-label d-block">평점</label>
        <div className="star-row" role="radiogroup" aria-label="별점 선택">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || rating) >= n;
            return (
              <span
                key={n}
                role="radio"
                aria-checked={rating === n}
                tabIndex={0}
                className={`star ${active ? "active" : ""}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                onKeyDown={(e) => onKeyDownStar(e, n)}
                title={`${n}점`}
                style={{ cursor: "pointer", fontSize: 22, lineHeight: 1 }}
              >
                ★
              </span>
            );
          })}
          <span className="ms-2 small text-muted">{rating} / 5</span>
        </div>
      </div>

      <div className="mb-2">
        <label className="form-label">제목</label>
        <input
          className="form-control"
          placeholder="리뷰 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label className="form-label">내용</label>
        <textarea
          className="form-control"
          rows={4}
          placeholder="내용을 입력해주세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">이미지 URL (선택)</label>
        <input
          className="form-control"
          placeholder="https://example.com/image.jpg"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
      </div>

      <button className="btn btn-dark" disabled={submitting}>
        {submitting ? "등록 중..." : "등록"}
      </button>
    </form>
  );
}