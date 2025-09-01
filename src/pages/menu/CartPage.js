// src/pages/menu/CartPage.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CartPage.css";

import { onBuyNow as payNow } from "../../components/payment/onBuyNow";
import { createOrder } from "../../services/order";
import { syncCartBadge } from "../../lib/syncCartBadge";
import { useMe } from "../../providers/MeProvider";

const SHIPPING_FEE = 3000;

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%239ca3af">no image</text></svg>';

const fmt = (n) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n ?? 0);

async function api(path, options) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function CartPage() {
  const navigate = useNavigate();
  const { me } = useMe();

  const [items, setItems] = useState([]); // [{id, menuId, name, image, salePrice, originalPrice, qty, stock}]
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(() => new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { ok, data } = await api("/cart");
        if (!ok || !mounted) return;

        const rows = Array.isArray(data) ? data : data?.items ?? [];

        const normalized = rows.map((row) => ({
          id: row.cartId,
          menuId: row.menuId,
          name: row.menuName,
          image: row.image,
          salePrice: Number(row.salePrice) || 0,
          originalPrice:
            row.originalPrice === null || row.originalPrice === undefined
              ? null
              : Number(row.originalPrice),
          qty: Number(row.quantity) || 1,
          stock: Number(row.stock) || 9999,
        }));

        setItems(normalized);
        setChecked(new Set(normalized.map((i) => i.id)));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const allChecked = useMemo(
    () => items.length > 0 && items.every((i) => checked.has(i.id)),
    [items, checked]
  );

  const selectedItems = useMemo(
    () => items.filter((i) => checked.has(i.id)),
    [items, checked]
  );

  const productTotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.salePrice * i.qty, 0),
    [selectedItems]
  );

  const shipping = selectedItems.length > 0 ? SHIPPING_FEE : 0;
  const grandTotal = productTotal + shipping;

  const toggleAll = (e) => {
    if (e.target.checked) setChecked(new Set(items.map((i) => i.id)));
    else setChecked(new Set());
  };

  const toggleOne = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateQty = async (item, nextQty) => {
    if (nextQty < 1) nextQty = 1;
    if (item.stock && nextQty > item.stock) nextQty = item.stock;

    setItems((arr) =>
      arr.map((i) => (i.id === item.id ? { ...i, qty: nextQty } : i))
    );

    setBusy(true);
    try {
      const { ok } = await api(`/cart/items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: nextQty }),
      });
      if (!ok) alert("수량 변경에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm("이 상품을 장바구니에서 삭제할까요?")) return;

    setItems((arr) => arr.filter((i) => i.id !== item.id));
    setChecked((s0) => {
      const s = new Set(s0);
      s.delete(item.id);
      return s;
    });

    setBusy(true);
    try {
      const { ok } = await api(`/cart/items/${item.id}`, { method: "DELETE" });
      if (!ok) alert("삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  // 포트원 결제
  const handlePay = useCallback(async () => {
    if (!me) {
      navigate("/login");
      return;
    }
    if (selectedItems.length === 0) return;

    try {
      setBusy(true);
      const itemsPayload = selectedItems.map((it) => ({
        menuId: it.menuId,
        quantity: it.qty,
      }));

      await payNow(null, 0, {
        navigate,
        createOrder,
        syncCartBadge,
        user: {
          userEmail: me.userEmail,
          userName: me.userName,
          phone: me.phone,
        },
        prepareByItems: true,
        items: itemsPayload,
        userCouponId: null,
        usePoints: 0,
        useDynamicScript: true,
      });
    } finally {
      setBusy(false);
    }
  }, [me, navigate, selectedItems]);

  if (loading) return <div className="cart-page container">불러오는 중…</div>;

  return (
    <div className="cart-page container">
      <div className="cart-toolbar">
        <label className="check-all">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} /> 전체선택
          <span className="count">({checked.size}/{items.length})</span>
        </label>

        <button
          className="text-btn danger"
          disabled={checked.size === 0 || busy}
          onClick={async () => {
            if (!window.confirm("선택한 상품을 삭제할까요?")) return;
            const ids = Array.from(checked);
            setItems((arr) => arr.filter((i) => !ids.includes(i.id)));
            setChecked(new Set());

            setBusy(true);
            try {
              await Promise.all(
                ids.map((id) => api(`/cart/items/${id}`, { method: "DELETE" }))
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          선택삭제
        </button>
      </div>

      <ul className="cart-list">
        {items.map((item) => {
          const hasDiscount =
            item.originalPrice != null && item.originalPrice > item.salePrice;
          const percent = hasDiscount
            ? Math.round(
                ((item.originalPrice - item.salePrice) / item.originalPrice) *
                  100
              )
            : 0;

          return (
            <li key={item.id} className="cart-item">
              <div className="row-1">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={checked.has(item.id)}
                    onChange={() => toggleOne(item.id)}
                  />
                </label>

                <div className="title">
                  <Link
                    to={`/menus/${item.menuId}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                    aria-label={`${item.name} 상세보기`}
                  >
                    {item.name}
                  </Link>
                </div>

                <button
                  className="icon-x"
                  aria-label="삭제"
                  onClick={() => removeItem(item)}
                  disabled={busy}
                >
                  ✕
                </button>
              </div>

              <div className="row-2">
                <div className="thumb">
                  <Link to={`/menus/${item.menuId}`} aria-label={`${item.name} 상세보기`}>
                    <img
                      src={item.image || FALLBACK_IMG}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                  </Link>
                </div>

                <div className="pricebox">
                  {hasDiscount ? (
                    <>
                      <div className="price-line">
                        <span className="badge-sale">{percent}%</span>
                        <span className="price-main">{fmt(item.salePrice)}원</span>
                      </div>
                      <div className="price-sub">
                        <s>{fmt(item.originalPrice)}원</s>
                      </div>
                    </>
                  ) : (
                    <div className="price-line">
                      <span className="price-main">{fmt(item.salePrice)}원</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="row-3">
                <div className="qty">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item, item.qty - 1)}
                    disabled={busy || item.qty <= 1}
                    aria-label="감소"
                  >
                    −
                  </button>
                  <div className="qty-num" aria-live="polite">
                    {item.qty}
                  </div>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item, item.qty + 1)}
                    disabled={busy || (item.stock && item.qty >= item.stock)}
                    aria-label="증가"
                  >
                    +
                  </button>
                </div>
                {item.stock && item.qty >= item.stock && (
                  <div className="stock-note">재고 {item.stock}개 한도</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="cart-summary">
        <div className="row">
          <span>상품가격</span>
          <strong>{fmt(productTotal)}원</strong>
        </div>
        <div className="row">
          <span>배송비</span>
          <strong>{fmt(shipping)}원</strong>
        </div>
        <div className="divider" />
        <div className="row total">
          <span>총 결제금액</span>
          <strong>{fmt(grandTotal)}원</strong>
        </div>

        <button
          className="order-btn"
          disabled={selectedItems.length === 0 || busy}
          onClick={handlePay}
        >
          선택 상품 결제하기
        </button>
      </div>
    </div>
  );
}