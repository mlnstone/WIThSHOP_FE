// src/components/MenuGrid.jsx
import React from "react";

export default function MenuGrid({ items }) {
  if (!items?.length) return <div className="text-muted">표시할 메뉴가 없습니다.</div>;

  return (
    <div className="row g-3">
      {items.map((m) => {
        const id = m.menuId ?? m.id;
        const name = m.menuName ?? m.name ?? "이름 없음";
        const price = m.salePrice ?? m.price ?? 0;
        const img = m.image ?? "https://via.placeholder.com/300x200?text=No+Image";

        return (
          <div className="col-6 col-md-4 col-lg-3" key={id}>
            <div className="card h-100">
              <img src={img} alt={name} className="card-img-top" style={{ objectFit: "cover", height: 160 }} />
              <div className="card-body d-flex flex-column">
                <div className="fw-semibold mb-1" title={name} style={{ minHeight: 44 }}>{name}</div>
                <div className="text-primary fw-bold mb-2">{price.toLocaleString()}원</div>
                <button className="btn btn-sm btn-outline-dark mt-auto">담기</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}