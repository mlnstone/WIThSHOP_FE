// /src/components/common/Pagination.js
import React from "react";

export default function Pagination({
  page = 0,                 // 현재 페이지(0-base)
  totalPages = 1,           // 총 페이지 수
  onChange,                 // (p:number) => void
  blockSize = 5,            // 페이지 블록 크기
  variant = "dark",         // 'dark' | 'primary' | 'gray'
  size = "sm",              // 'sm' | '' | 'lg'
  className = "",
}) {
  if (totalPages <= 0) return null;

  const currentBlock = Math.floor(page / blockSize);
  const startPage = currentBlock * blockSize;
  const endPage = Math.min(startPage + blockSize - 1, totalPages - 1);

  const isFirst = page === 0;
  const isLast = page >= totalPages - 1;

  const palette = {
    dark:   { active: "btn-dark",    idle: "btn-outline-dark" },
    primary:{ active: "btn-primary", idle: "btn-outline-primary" },
    gray:   { active: "btn-secondary", idle: "btn-outline-secondary" },
  }[variant] || { active: "btn-dark", idle: "btn-outline-dark" };

  const sz = size ? `btn-${size}` : "";

  const go = (p) => onChange?.(Math.min(Math.max(p, 0), totalPages - 1));

  return (
    <div className={`d-flex gap-2 justify-content-center ${className}`}>
      <button className={`btn ${sz} ${palette.idle}`} disabled={isFirst} onClick={() => go(0)} aria-label="첫 페이지">
        &laquo;
      </button>
      <button
        className={`btn ${sz} ${palette.idle}`}
        disabled={startPage === 0}
        onClick={() => go(Math.max(0, startPage - 1))}
        aria-label="이전 블록"
      >
        &lt;
      </button>

      {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
        const p = startPage + i;
        const active = p === page;
        return (
          <button
            key={p}
            className={`btn ${sz} ${active ? palette.active : palette.idle}`}
            onClick={() => go(p)}
            aria-current={active ? "page" : undefined}
          >
            {p + 1}
          </button>
        );
      })}

      <button
        className={`btn ${sz} ${palette.idle}`}
        disabled={endPage >= totalPages - 1}
        onClick={() => go(Math.min(totalPages - 1, endPage + 1))}
        aria-label="다음 블록"
      >
        &gt;
      </button>
      <button
        className={`btn ${sz} ${palette.idle}`}
        disabled={isLast}
        onClick={() => go(totalPages - 1)}
        aria-label="마지막 페이지"
      >
        &raquo;
      </button>
    </div>
  );
}