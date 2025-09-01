// src/lib/payment/onBuyNow.js

// (선택) PortOne SDK 로더: public/index.html에 스크립트를 넣지 않았다면 사용
async function ensureIamportLoaded() {
  if (window.IMP) return true;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.iamport.kr/v1/iamport.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("iamport.js 로드 실패"));
    document.body.appendChild(s);
  });
  return !!window.IMP;
}

/**
 * onBuyNow(menu, qty, options)
 *
 * @param {object|null} menu - 단일상품 결제 시 { menuId, menuName, ... }, 장바구니 결제면 null 가능
 * @param {number|null} qty  - 단일상품 결제 시 수량(1 이상), 장바구니 결제면 null 가능
 * @param {object} options
 *  - navigate, createOrder, syncCartBadge
 *  - backend: 기본 process.env.REACT_APP_BACKEND || ""
 *  - token: 기본 localStorage.getItem("accessToken")
 *  - impCode: 기본 process.env.REACT_APP_IAMPORT_MERCHANT
 *  - pg: 기본 "html5_inicis.INIpayTest"
 *  - buyer: { email, name, tel, addr }
 *  - useDynamicScript: true면 SDK 동적 로드
 *  - prepareByItems: true 면 /prepare-by-items 사용
 *  - items: [{ menuId, quantity }]
 *  - userCouponId: string | null
 *  - usePoints: number
 *
 * @returns {Promise<boolean>} 성공시 true, 실패시 false
 */
export async function onBuyNow(menu, qty, options = {}) {
  try {
    const {
      navigate,
      createOrder,
      syncCartBadge,
      backend = process.env.REACT_APP_BACKEND ?? "",
      token = localStorage.getItem("accessToken") || "",
      impCode = process.env.REACT_APP_IAMPORT_MERCHANT || "",
      pg = "html5_inicis.INIpayTest",
      buyer = {
        email: options.user?.userEmail || "test@example.com",
        name: options.user?.userName || "테스트유저",
        tel: options.user?.phone || "010-0000-0000",
        addr: options.user?.addr || "",
      },
      useDynamicScript = false,

      // 장바구니/혜택 결제 옵션
      prepareByItems = false,
      items,
      userCouponId = null,
      usePoints = 0,
    } = options;

    // ✅ 단일상품 결제일 때만 menu/qty 검사
    if (!prepareByItems) {
      if (!menu) {
        alert("상품 정보를 불러오는 중입니다.");
        return false;
      }
      if (!qty || qty < 1) {
        alert("수량을 1개 이상 선택하세요.");
        return false;
      }
    }

    // 0) 필요시 포트원 SDK 동적 로드
    if (useDynamicScript) {
      const ok = await ensureIamportLoaded();
      if (!ok) {
        alert("결제 스크립트 로드 실패");
        return false;
      }
    }

    // 1) 사전검증
    let merchant_uid, amount;
    let prep = null;

    if (prepareByItems) {
      // 쿠폰/포인트/배송비 포함 사전검증
      const payload = {
        items:
          Array.isArray(items) && items.length > 0
            ? items
            : menu && qty
            ? [{ menuId: menu.menuId, quantity: qty }]
            : [],
        userCouponId: userCouponId || null,
        usePoints: Math.max(0, Number(usePoints) || 0),
      };

      if (!payload.items.length) {
        alert("결제할 상품이 없습니다.");
        return false;
      }

      const prepRes = await fetch(`${backend}/api/payments/prepare-by-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!prepRes.ok) {
        const msg = await prepRes.text().catch(() => "");
        alert(`결제 준비 실패: ${msg || prepRes.status}`);
        return false;
      }

      prep = await prepRes.json();
      merchant_uid = prep.merchant_uid;
      amount = prep.amount;
    } else {
      // 기존 단순 사전검증
      const prepRes = await fetch(`${backend}/api/payments/prepare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ quantity: qty }),
      });

      if (!prepRes.ok) {
        const msg = await prepRes.text().catch(() => "");
        alert(`결제 준비 실패: ${msg || prepRes.status}`);
        return false;
      }

      const result = await prepRes.json(); // { merchant_uid, amount, quantity }
      merchant_uid = result.merchant_uid;
      amount = result.amount;
    }

    // 2) 결제창 호출
    if (!window.IMP) {
      alert("결제 스크립트가 로드되지 않았습니다. 새로고침 후 다시 시도해주세요.");
      return false;
    }
    const IMP = window.IMP;
    IMP.init(impCode);

    const payTitle = (() => {
      if (!prepareByItems) {
        return `${menu?.menuName ?? "상품"} x ${qty}`;
      }
      const count = Array.isArray(items) ? items.length : 0;
      if (count <= 0) return "장바구니 결제";
      if (count === 1) return `장바구니: ${items[0].menuId}`;
      return `장바구니 ${count}건`;
    })();

    const payOk = await new Promise((resolve) => {
      IMP.request_pay(
        {
          pg,
          pay_method: "card",
          merchant_uid, // 서버 생성값
          name: payTitle,
          amount, // 서버 계산값
          buyer_email: buyer.email,
          buyer_name: buyer.name,
          buyer_tel: buyer.tel,
          buyer_addr: buyer.addr,
          // channelKey: process.env.REACT_APP_IAMPORT_CHANNEL_KEY, // 사용하는 경우만
        },
        (rsp) => {
          if (!rsp || !rsp.success) {
            alert(`결제 실패: ${rsp?.error_msg || "알 수 없는 오류"}`);
            return resolve(false);
          }
          return resolve(rsp);
        }
      );
    });

    if (!payOk || payOk === false) return false;

    // 3) 사후검증
    const verifyRes = await fetch(`${backend}/api/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        imp_uid: payOk.imp_uid,
        merchant_uid: payOk.merchant_uid,
      }),
    });

    if (!verifyRes.ok) {
      const msg = await verifyRes.text().catch(() => "");
      alert(`결제 검증 실패: ${msg || verifyRes.status}`);
      return false;
    }

    // 4) 주문 생성
    if (typeof createOrder === "function") {
      const orderItems = prepareByItems
        ? Array.isArray(items) && items.length
          ? items
          : [{ menuId: menu.menuId, quantity: qty }]
        : [{ menuId: menu.menuId, quantity: qty }];

      const extras =
        prepareByItems && prep
          ? {
              merchantUid: merchant_uid,
              discountCoupon: prep.discountCoupon ?? 0,
              discountPoints: prep.discountPoints ?? 0,
              shippingFee: prep.shippingFee ?? 0,
              userCouponId: userCouponId || null,
            }
          : {};

      const res = await createOrder(orderItems, extras);
      if (!res?.ok) {
        alert(res?.data?.message || "주문 생성 실패");
        return false;
      }

      if (typeof syncCartBadge === "function") {
        await syncCartBadge();
      }

      if (typeof navigate === "function") {
        navigate(`/orders/${res.data.orderCode}`);
      }
    }

    return true;
  } catch (e) {
    console.error(e);
    alert("결제 처리 중 오류가 발생했습니다.");
    return false;
  }
}