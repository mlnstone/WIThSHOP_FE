import React, { useState } from "react";
import BestByText from "../../pages/category/BestByText";

export default function BestByTextWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: "#111",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,.25)",
          zIndex: 2000, // 다른 팝업보다 위로
        }}
        aria-label="카테고리 베스트 추천 열기"
      >
        BEST
      </button>

      {/* 미니 패널 */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 84,        // 버튼 위로 살짝
            width: 360,
            maxHeight: "70vh",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 12px 28px rgba(0,0,0,.2)",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 600,
            }}
          >
            베스트 추천
            <button
              onClick={() => setOpen(false)}
              style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          {/* BestByText를 위젯 안에서 재사용 */}
          <div style={{ padding: 12, overflow: "auto", maxHeight: "calc(70vh - 44px)" }}>
            <BestByText compact />
          </div>
        </div>
      )}
    </>
  );
}