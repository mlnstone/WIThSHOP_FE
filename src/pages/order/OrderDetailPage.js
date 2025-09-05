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

  const toWon = (n) => (Number(n) || 0).toLocaleString() + "원";

  // ✅ 상태 라벨(한글)
  const statusLabel = useMemo(() => {
    const s = order?.orderStatus;
    return (
      {
        REQUESTED: "주문요청",
        APPROVED: "결제완료",
        SHIPPED: "배송중",
        DELIVERED: "배송완료",
        CANCELED: "취소",
        REJECTED: "거절",
      }[s] || s || "-"
    );
  }, [order]);
  // 파일 상단에 authHeaders 이미 있음

  // ...컴포넌트 내부
  const goWriteOrAlert = async (menuId) => {
    try {
      const res = await fetch(`/reviews/exists?menuId=${menuId}&orderCode=${order.orderCode}`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      const exists = !!data?.exists;

      if (exists) {
        alert("이미 등록한 리뷰가 있습니다!");
        // 작성페이지 대신 해당 메뉴의 리뷰 섹션으로 보내 주는 UX
        navigate(`/menus/${menuId}#reviews`);
        return;
      }

      // 없으면 작성 페이지로
      navigate(`/reviews/write?orderCode=${order.orderCode}&menuId=${menuId}`);
    } catch {
      // 네트워크 오류 시엔 일단 작성 페이지로 보내거나, 재시도 유도
      alert("상태 확인 중 오류가 발생했어요. 작성 페이지로 이동합니다.");
      navigate(`/reviews/write?orderCode=${order.orderCode}&menuId=${menuId}`);
    }
  };
  const fmtOrderDate = (dt) => {
    if (!dt) return "-";
    const d = new Date(dt);
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
  };

  const FIXED_IMG =
    "https://image.zeta-ai.io/profile-image/c7465638-8779-49b4-9158-bc3d504d2333/a683c4cf-7c04-48eb-97d4-043400c3205e.jpeg?w=96&q=75&f=webp";

  // 상단 상태 UI (표시용)
  const statusUI = (() => {
    const s = order?.orderStatus;
    if (s === "DELIVERED") {
      return { title: "배송완료", tone: "#198754", sub: "2025/09/04(목) 도착" };
    }
    if (s === "SHIPPED") return { title: "배송중", tone: "#0dcaf0", sub: "배송 중입니다" };
    if (s === "REQUESTED") return { title: "주문요청", tone: "#6c757d", sub: "주문 확인 중" };
    if (s === "APPROVED") return { title: "결제완료", tone: "#0d6efd", sub: "상품 준비 중" };
    if (s === "REJECTED") return { title: "주문거절", tone: "#ffc107", sub: "결제가 거절되었습니다" };
    if (s === "CANCELED") return { title: "취소됨", tone: "#212529", sub: "주문이 취소되었습니다" };
    return { title: s || "-", tone: "#6c757d", sub: "" };
  })();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/orders/code/${orderCode}`, { headers: authHeaders() });
        const j = await r.json().catch(() => null);
        if (!r.ok) { setErr(j?.message || "주문을 불러올 수 없습니다."); return; }
        if (alive) setOrder(j);
      } catch {
        setErr("네트워크 오류가 발생했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [orderCode]);

  const onCancel = async () => {
    if (!order) return;
    if (!window.confirm("이 주문을 취소하시겠습니까?")) return;
    try {
      const rRefund = await fetch(`/api/payments/refund`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          impUid: order.impUid,
          orderCode: order.orderCode,
          reason: "고객 요청 취소",
        }),
      });
      const jr = await rRefund.json().catch(() => null);
      if (!rRefund.ok) return alert(jr?.message || "환불에 실패했습니다.");

      const r = await fetch(`/orders/${order.orderId}/cancel`, {
        method: "PUT",
        headers: authHeaders(),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) return alert(j?.message || "취소에 실패했습니다.");

      setOrder(j);
      alert("환불 및 주문 취소가 완료되었습니다.");
    } catch {
      alert("네트워크 오류");
    }
  };

  if (loading) return <div className="container py-4">불러오는 중...</div>;
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
    <div className="container py-4" style={{ maxWidth: 980 }}>
      {/* 상단 */}
      <div className="mb-3">
        <h2 className="fw-bold mb-2" style={{ letterSpacing: "-0.3px" }}>주문상세</h2>
        <div className="text-muted">
          {fmtOrderDate(order.orderCreatedAt)} 주문 · 주문번호 {order.orderCode}
        </div>
      </div>

      {/* 상태/배송 섹션 */}
      <div className="card mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fw-bold" style={{ color: statusUI.tone }}>{statusUI.title}</span>
            {statusUI.sub && (<><span className="text-muted">·</span><span className="fw-bold" style={{ color: statusUI.tone }}>{statusUI.sub}</span></>)}
          </div>

          <div className="d-flex flex-column gap-4">
            {(order.items || []).map((it, idx) => (
              <div key={`${it.menuId}-${idx}`} className="d-flex align-items-center">
                <img
                  src={FIXED_IMG}
                  alt={it.menuName}
                  width={72}
                  height={72}
                  style={{ objectFit: "cover", borderRadius: 12, flex: "0 0 72px", background: "#f8f9fa" }}
                  onError={(e) => (e.currentTarget.src = "/noimage.png")}
                />

                <div className="ms-3 flex-grow-1">
                  {/* 이름 + (배송완료일 때) 리뷰 버튼을 한 줄에 */}
                  <div className="d-flex align-items-center gap-2">
                    <div className="fw-semibold" style={{ lineHeight: 1.4 }}>
                      {it.menuName}
                    </div>

                    {order.orderStatus === "DELIVERED" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => goWriteOrAlert(it.menuId)}
                      >
                        리뷰 작성
                      </button>
                    )}
                  </div>

                  <div className="text-muted mt-1">
                    {toWon(it.price)} · {it.quantity}개
                  </div>
                </div>

                <div className="ms-auto text-end fw-semibold" style={{ minWidth: 120 }}>
                  {toWon(it.lineTotal)}
                </div>
              </div>
            ))}

            {(!order.items || order.items.length === 0) && (
              <div className="text-center text-muted py-4">항목이 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {/* 요약 */}
      <div className="card mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body d-flex flex-wrap gap-4 align-items-center">
          <div className="fw-semibold">
            주문금액 : {toWon(order.orderPrice)} &nbsp; | &nbsp; 상태 : {statusLabel}
          </div>

          <div className="ms-auto d-flex gap-2">
            {order.orderStatus === "REQUESTED" && (
              <button className="btn btn-danger" onClick={onCancel}>주문 취소</button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}