// src/components/main/BestMenusGrid.js
import React, { useEffect, useState } from "react";
import MenuGrid from "../menu/MenuGrid";
import { Spinner } from "react-bootstrap";

const BACKEND = process.env.REACT_APP_BACKEND;

export default function BestMenusGrid() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/menus/best?page=0&size=12`); // 12개
        const j = await r.json().catch(() => null);
        const ids = (j?.content || []).map((x) => x.menuId).filter(Boolean);
        if (abort || ids.length === 0) {
          setItems([]);
          return;
        }
        const detailPromises = ids.slice(0, 12).map(async (id) => { // 12개
          try {
            const res = await fetch(`${BACKEND}/menus/${id}`);
            const d = await res.json().catch(() => null);
            if (!d) return null;
            return {
              menuId: d.menuId ?? d.id ?? id,
              menuName: d.menuName ?? d.name ?? "이름 없음",
              salePrice: d.salePrice ?? d.price ?? 0,
              originalPrice:
                d.originalPrice ?? d.listPrice ?? d.compareAtPrice ?? null,
              image: d.image ?? d.imageUrl ?? d.thumbnailUrl ?? null,
              avgRating: d.avgRating ?? d.rating ?? undefined,
              reviewCount: d.reviewCount ?? d.reviewsCount ?? undefined,
            };
          } catch {
            return null;
          }
        });
        const details = (await Promise.all(detailPromises)).filter(Boolean);
        if (!abort) setItems(details.slice(0, 12)); // 12개
      } catch {
        if (!abort) setItems([]);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="best-wrap my-5">
      <div className="container-xxl">

        <h4 className="fw-bold mb-3 text-center">🔥 베스트 상품 12</h4>  
        <MenuGrid
          items={items}
          colClass="col-12 col-sm-6 col-md-3"
        />
      </div>
    </section>
  );
}