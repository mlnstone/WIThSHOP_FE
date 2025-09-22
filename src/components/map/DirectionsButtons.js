// src/components/map/DirectionsButtons.js
import React from "react";

export default function DirectionsButtons({ name, lat, lng }) {
  const kakaoTo = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
      <a className="btn btn-sm btn-dark" href={kakaoTo} target="_blank" rel="noreferrer">
        카카오맵 길찾기
      </a>
    </div>
  );
}