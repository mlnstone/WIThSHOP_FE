// src/components/common/PopupBox.js
import React, { useEffect, useState } from "react";

export default function PopupBox({
  storageKey,
  title,
  message,
  images = [],
  offset = { x: 0, y: 0 }, // 👉 추가
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hideUntil = localStorage.getItem(storageKey);
    if (!hideUntil || Date.now() > Number(hideUntil)) {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  const closeFor24h = () => {
    const expire = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(storageKey, String(expire));
    setVisible(false);
  };

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.card,
          transform: `translate(${offset.x}px, ${offset.y}px)`, // 👉 위치 보정
        }}
      >
        {(title || message) && (
          <div style={{ marginBottom: 8 }}>
            {title && <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>}
            {message && <div style={{ fontSize: 14, color: "#666" }}>{message}</div>}
          </div>
        )}

        {images.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: 8,
              gridTemplateColumns: images.length > 1 ? "1fr 1fr" : "1fr",
            }}
          >
            {images.map((src, i) => (
              <div key={i} style={styles.square}>
                <img src={src} alt={`popup-${i}`} style={styles.img} />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button className="btn btn-secondary btn-sm me-2" onClick={closeFor24h}>
            24시간 보지 않기
          </button>
          <button className="btn btn-dark btn-sm" onClick={() => setVisible(false)}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 12,
  },
  card: {
    width: 320,
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
    border: "1px solid #eee",
    transition: "transform .2s ease",
  },
  square: {
    background: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    aspectRatio: "1 / 1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #f0f0f0",
  },
  img: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    display: "block",
    userSelect: "none",
    pointerEvents: "none",
  },
};