// src/pages/checkout/BenefitsPage.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onBuyNow as payNow } from "../../components/payment/onBuyNow";
import { createOrder } from "../../services/order";
import { syncCartBadge } from "../../lib/syncCartBadge";
import { useMe } from "../../providers/MeProvider";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function BenefitsPage() {
  const q = useQuery();
  const navigate = useNavigate();
  const { me, loading: meLoading } = useMe();

  const menuId = Number(q.get("menuId"));
  const qty = Math.max(1, Number(q.get("qty")) || 1);

  // 기본 데이터
  const [menu, setMenu] = useState(null);
  const [shippingFee, setShippingFee] = useState(3000);

  // 혜택 상태
  const [pointBalance, setPointBalance] = useState(0);
  const [usePoints, setUsePoints] = useState(0); // 사용자가 입력한 원시 값
  const [myCoupons, setMyCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [couponPreview, setCouponPreview] = useState(0);

  // UI 에러
  const [pointError, setPointError] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 메뉴/배송비
  useEffect(() => {
    if (!menuId) return;
    let alive = true;
    (async () => {
      try {
        const r1 = await fetch(`/menus/${menuId}`);
        const j1 = await r1.json().catch(() => null);
        if (alive && r1.ok) setMenu(j1);

        const r2 = await fetch(`/config/shipping-fee`);
        const j2 = await r2.json().catch(() => null);
        if (alive && r2.ok && typeof j2 === "number") setShippingFee(j2);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [menuId]);

  // 내 쿠폰/포인트
  useEffect(() => {
    if (!me) return;
    let alive = true;
    (async () => {
      try {
        const headers = { Accept: "application/json", ...getAuthHeaders() };

        const rp = await fetch(`/points`, { headers });
        if (rp.ok) {
          const jp = await rp.json().catch(() => null);
          if (alive && jp && typeof jp.balance === "number") {
            setPointBalance(jp.balance);
          }
        }

        const rc = await fetch(`/coupons`, { headers });
        if (rc.ok) {
          const jc = await rc.json().catch(() => null);
          if (alive && Array.isArray(jc)) setMyCoupons(jc);
        }
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [me]);

  // 금액 관련
  const price = menu?.salePrice ?? menu?.price ?? 0;
  const subtotal = useMemo(() => price * qty, [price, qty]);

  // 쿠폰 미리보기
  useEffect(() => {
    if (!me || !selectedCouponId) {
      setCouponPreview(0);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const headers = { Accept: "application/json", ...getAuthHeaders() };
        const r = await fetch(
          `/coupons/${selectedCouponId}/preview?orderAmount=${subtotal}`,
          { headers }
        );
        if (!r.ok) {
          setCouponPreview(0);
          return;
        }
        const j = await r.json().catch(() => null);
        if (alive && j && typeof j.discountApplied === "number") {
          setCouponPreview(j.discountApplied);
        }
      } catch {
        setCouponPreview(0);
      }
    })();
    return () => {
      alive = false;
    };
  }, [me, selectedCouponId, subtotal]);

  // 쿠폰 라벨
  const couponLabel = (c) => {
    const name =
      c?.couponName ?? c?.name ?? c?.coupon?.couponName ?? "쿠폰";
    const code = c?.code ?? c?.coupon?.code;
    const type = c?.discountType ?? c?.coupon?.discountType;
    const discount = c?.discount ?? c?.coupon?.discount;
    const badge =
      type === "PERCENT"
        ? `${discount}%`
        : `${(discount ?? 0).toLocaleString()}원`;
    return `${name}${code ? `(${code})` : ""} - ${badge}`;
  };

  // 최대 사용 가능 포인트 (쿠폰 적용 후 남은 결제금액 한도 + 보유 한도)
  const maxUsablePoints = useMemo(
    () =>
      Math.min(
        pointBalance,
        Math.max(0, subtotal - (couponPreview || 0))
      ),
    [pointBalance, subtotal, couponPreview]
  );

  // 입력값이 한도를 넘으면 에러/경고, 포커스 아웃 또는 한도 변경 시 자동 보정
  useEffect(() => {
    // 쿠폰/가격/보유 변경으로 max가 줄어들면 자동 감소
    if ((Number(usePoints) || 0) > maxUsablePoints) {
      setUsePoints(maxUsablePoints);
      setPointError(
        maxUsablePoints === 0
          ? "지금은 적립금을 사용할 수 없어요."
          : `최대 ${maxUsablePoints.toLocaleString()}P 까지 사용 가능합니다.`
      );
    } else {
      setPointError("");
    }
  }, [maxUsablePoints]); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizeInt = (v) => {
    const n = Math.floor(Number(v) || 0);
    return n < 0 ? 0 : n;
  };

  const onChangePoints = (e) => {
    const raw = normalizeInt(e.target.value);
    setUsePoints(raw);

    if (raw > maxUsablePoints) {
      setPointError(
        `최대 ${maxUsablePoints.toLocaleString()}P 까지 사용 가능합니다.`
      );
    } else {
      setPointError("");
    }
  };

  const onBlurPoints = (e) => {
    const raw = normalizeInt(e.target.value);
    const clamped = Math.min(raw, maxUsablePoints);
    if (clamped !== raw) {
      setUsePoints(clamped);
    }
    if (clamped > maxUsablePoints) {
      setPointError(
        `최대 ${maxUsablePoints.toLocaleString()}P 까지 사용 가능합니다.`
      );
    } else {
      setPointError("");
    }
  };

  // 실제 계산에 쓰이는 값(항상 안전)
  const expectedPoints = Math.min(
    Math.max(0, Number(usePoints) || 0),
    maxUsablePoints
  );
  const expectedPay = Math.max(
    0,
    subtotal - (couponPreview || 0) - expectedPoints + shippingFee
  );

  const handlePay = useCallback(async () => {
    if (!me) {
      navigate("/login");
      return;
    }

    // 서버로 보내는 최종 안전값
    const safeUsePoints = expectedPoints;

    await payNow(menu, qty, {
      navigate,
      createOrder,
      syncCartBadge,
      user: {
        userEmail: me.userEmail,
        userName: me.userName,
        phone: me.phone,
      },
      prepareByItems: true,
      items: [{ menuId: menu.menuId, quantity: qty }],
      userCouponId: selectedCouponId || null,
      usePoints: safeUsePoints,
      useDynamicScript: true,
    });
  }, [
    me,
    menu,
    qty,
    selectedCouponId,
    expectedPoints,
    navigate,
  ]);

  if (meLoading || !menu) return <div className="container py-4">불러오는 중…</div>;

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <button className="btn btn-link px-0 mb-3" onClick={() => navigate(-1)}>
        ← 뒤로
      </button>
      <h3 className="mb-3">혜택 선택</h3>

      <div className="mb-3 p-3 border rounded-3">
        <div className="fw-semibold mb-1">{menu.menuName}</div>
        <div className="text-muted small">수량 {qty.toLocaleString()}개</div>
        <div className="mt-1">상품합계 {subtotal.toLocaleString()}원</div>
      </div>

      {/* 쿠폰 */}
      <div className="mb-3">
        <label className="form-label">쿠폰 선택</label>
        <select
          className="form-select text-start"
          value={selectedCouponId}
          onChange={(e) => setSelectedCouponId(e.target.value)}
        >
          <option value="">선택 안 함</option>
          {myCoupons.map((c) => (
            <option
              key={c.userCouponId ?? c?.id ?? c?.userCoupon?.userCouponId}
              value={c.userCouponId ?? c?.id ?? c?.userCoupon?.userCouponId}
            >
              {couponLabel(c)}
            </option>
          ))}
        </select>
        <div className="form-text">
          예상 할인액: -{(couponPreview || 0).toLocaleString()}원
        </div>
      </div>

      {/* 적립금 */}
      <div className="mb-4">
        <label className="form-label">적립금 사용</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          className={`form-control text-start ${pointError ? "is-invalid" : ""}`}
          value={usePoints}
          onChange={onChangePoints}
          onBlur={onBlurPoints}
          placeholder="0"
        />
        {!pointError ? (
          <div className="form-text">
            보유 {pointBalance.toLocaleString()}P · 최대{" "}
            {maxUsablePoints.toLocaleString()}P
          </div>
        ) : (
          <div className="invalid-feedback d-block">{pointError}</div>
        )}
      </div>

      {/* 요약 */}
      <div className="p-3 border rounded-3 mb-3">
        <div className="small text-muted mb-1">
          상품합계 {subtotal.toLocaleString()}원
          {selectedCouponId && <> · 쿠폰 -{(couponPreview || 0).toLocaleString()}원</>}
          {expectedPoints > 0 && <> · 포인트 -{expectedPoints.toLocaleString()}원</>}
          · 배송비 +{shippingFee.toLocaleString()}원
        </div>
        <div className="fs-5">
          결제 예상 금액 <strong>{expectedPay.toLocaleString()}원</strong>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          장바구니로
        </button>
        <button
          className="btn btn-dark flex-grow-1"
          onClick={handlePay}
          disabled={expectedPay <= 0 && shippingFee <= 0}
        >
          결제하기
        </button>
      </div>
    </div>
  );
}