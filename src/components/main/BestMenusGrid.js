// src/components/main/BestMenusGrid.js
import React, { useEffect, useState } from "react";
import MenuGrid from "../menu/MenuGrid";
import { Spinner } from "react-bootstrap";
import { apiFetch } from "../../services/api";

export default function BestMenusGrid() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;

    (async () => {
      try {
        // 베스트 목록
        const { ok, data } = await apiFetch("/menus/best?page=0&size=12");
        if (!ok) throw new Error("best fetch fail");

        const ids = (data?.content || [])
          .map((x) => x.menuId)
          .filter(Boolean);

        if (abort || ids.length === 0) {
          setItems([]);
          return;
        }

        // 상세 병렬 요청 (최대 12개)
        const detailPromises = ids.slice(0, 12).map(async (id) => {
          try {
            const res = await apiFetch(`/menus/${id}`);
            if (!res.ok) return null;
            const d = res.data;
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
        if (!abort) setItems(details.slice(0, 12));
      } catch {
        if (!abort) setItems([]);
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
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
        <MenuGrid items={items} colClass="col-12 col-sm-6 col-md-3" />
      </div>
    </section>
  );
}