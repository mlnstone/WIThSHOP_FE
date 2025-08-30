// src/pages/order/OrderDetailPage.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authHeaders } from "../../services/api";

export default function OrderDetailPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 금액 포맷터
  const toWon = (n) => (Number(n) || 0).toLocaleString() + "원";

  // 상태 배지 색상
  // 상태 배지 색상
  const statusClass = useMemo(() => {
    switch (order?.orderStatus) {
      case "REQUESTED": return "badge bg-secondary";      // 주문 요청
      case "APPROVED": return "badge bg-primary";        // 승인됨
      case "REJECTED": return "badge bg-warning text-dark"; // 거절됨
      case "SHIPPED": return "badge bg-info";           // 배송 중
      case "DELIVERED": return "badge bg-success";        // 배송 완료
      case "CANCELED": return "badge bg-dark";           // 취소됨
      default: return "badge bg-light text-dark";
    }
  }, [order]);

  // 상세 조회
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/orders/code/${orderCode}`, { headers: authHeaders() });
        const j = await r.json().catch(() => null);
        if (!r.ok) {
          setErr(j?.message || "주문을 불러올 수 없습니다.");
          return;
        }
        if (alive) setOrder(j);
      } catch {
        setErr("네트워크 오류가 발생했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [orderCode]);

  // 주문 취소
  const onCancel = async () => {
    if (!order) return;
    if (!window.confirm("이 주문을 취소하시겠습니까?")) return;
    try {
      // 1) PG 환불 (전액)
      const rRefund = await fetch(`/api/payments/refund`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          impUid: order.impUid,      // ❗주문 응답에 impUid가 포함되어야 함
          orderCode: order.orderCode,
          reason: "고객 요청 취소",
        }),
      });
      const jr = await rRefund.json().catch(() => null);
      if (!rRefund.ok) {
        alert(jr?.message || "환불에 실패했습니다.");
        return;
      }

      // 2) 주문 상태 취소 (재고 롤백)
      const r = await fetch(`/orders/${order.orderId}/cancel`, {
        method: "PUT",
        headers: authHeaders(),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        alert(j?.message || "취소에 실패했습니다.");
        return;
      }
      // 성공 시 화면 상태 갱신
      setOrder(j);
      alert("환불 및 주문 취소가 완료되었습니다.");
    } catch {
      alert("네트워크 오류");
    }
  };

  if (loading) return <div className="container py-4">불러오는 중…</div>;
  if (err) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{err}</div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>뒤로</button>
        </div>
      </div>
    );
  }
  if (!order) return null;

  return (
    <div className="container py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">주문 상세</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>뒤로</button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-3">
            <div><span className="text-muted">주문코드</span><div className="fw-semibold">{order.orderCode}</div></div>
            <div><span className="text-muted">주문일시</span><div className="fw-semibold">{order.orderCreatedAt?.replace("T", " ").slice(0, 19)}</div></div>
            <div><span className="text-muted">주문금액</span><div className="fw-semibold">{toWon(order.orderPrice)}</div></div>
            <div><span className="text-muted">상태</span><div className={statusClass} style={{ fontSize: 12 }}>{order.orderStatus}</div></div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">주문 항목</div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>상품명</th>
                  <th style={{ width: 140 }} className="text-end">단가</th>
                  <th style={{ width: 100 }} className="text-end">수량</th>
                  <th style={{ width: 160 }} className="text-end">소계</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((it, idx) => (
                  <tr key={`${it.menuId}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{it.menuName}</td>
                    <td className="text-end">{toWon(it.price)}</td>
                    <td className="text-end">{it.quantity}</td>
                    <td className="text-end">{toWon(it.lineTotal)}</td>
                  </tr>
                ))}
                {(!order.items || order.items.length === 0) && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">항목이 없습니다.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={4} className="text-end">총액</th>
                  <th className="text-end">{toWon(order.orderPrice)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary" onClick={() => navigate("/")}>홈으로</button>
        {["REQUESTED", "APPROVED", "REJECTED"].includes(order.orderStatus) && (
          <button className="btn btn-danger ms-auto" onClick={onCancel}>주문 취소</button>
        )}
      </div>
    </div>
  );
}