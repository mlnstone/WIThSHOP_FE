// src/pages/CartPage.js
import React, { useEffect, useState } from "react";
import { changeCartQty, clearCart, fetchMyCart, removeCartItem } from "../../services/cart";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const { ok, data } = await fetchMyCart();
    setLoading(false);
    if (!ok) { alert("장바구니 조회 실패"); return; }

    const list = data?.items || [];
    setItems(list);

    // 헤더 배지 동기화(같은 탭/다른 탭 전파)
    const cnt = list.reduce((s, it) => s + (it.quantity || 0), 0);
    window.dispatchEvent(new CustomEvent("cart:set", { detail: cnt }));
    try { localStorage.setItem("__cartCount__", String(cnt)); } catch {}
    try { new BroadcastChannel("cart").postMessage({ type: "set", count: cnt }); } catch {}
  };

  useEffect(() => { reload(); }, []);

  const onChangeQty = async (cartId, quantity) => {
    const q = Number(quantity);
    if (!q || q < 1) return;
    const { ok, data } = await changeCartQty(cartId, q);
    if (!ok) {
      alert(data?.message || "변경 실패");
      return;
    }
    reload();
  };

  const onRemove = async (cartId) => {
    const { ok, data } = await removeCartItem(cartId);
    if (!ok) {
      alert(data?.message || "삭제 실패");
      return;
    }
    reload();
  };

  const onClear = async () => {
    if (!window.confirm("장바구니를 모두 비우시겠습니까?")) return;
    const { ok, data } = await clearCart();
    if (!ok) {
      alert(data?.message || "비우기 실패");
      return;
    }
    reload();
  };

  if (loading) return <div className="container py-4">불러오는 중…</div>;

  const total = items.reduce((sum, it) => sum + (it.salePrice || 0) * (it.quantity || 0), 0);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>🛒 장바구니</h3>
        <button className="btn btn-outline-danger btn-sm" onClick={onClear}>모두 비우기</button>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-secondary">장바구니가 비어 있습니다.</div>
      ) : (
        <div className="card p-0">
          <table className="table mb-0">
            <thead>
              <tr>
                <th style={{width: 80}}>이미지</th>
                <th>상품명</th>
                <th style={{width: 120}}>가격</th>
                <th style={{width: 140}}>수량</th>
                <th style={{width: 120}}>합계</th>
                <th style={{width: 80}}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.cartId}>
                  <td>
                    {it.image ? (
                      <img src={it.image} alt={it.menuName} style={{width:64, height:64, objectFit:"cover"}}/>
                    ) : "—"}
                  </td>
                  <td>{it.menuName}</td>
                  <td>{(it.salePrice || 0).toLocaleString()}원</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      className="form-control form-control-sm"
                      onChange={(e) => onChangeQty(it.cartId, e.target.value)}
                      style={{maxWidth: 100}}
                    />
                  </td>
                  <td>{((it.salePrice || 0) * (it.quantity || 0)).toLocaleString()}원</td>
                  <td>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => onRemove(it.cartId)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 d-flex justify-content-end">
            <strong>총 합계: {total.toLocaleString()}원</strong>
          </div>
        </div>
      )}
    </div>
  );
}