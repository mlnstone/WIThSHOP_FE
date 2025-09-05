// // src/components/PaymentButton.js
// import React, { useCallback, useEffect, useMemo, useState } from "react";


// const BACKEND = process.env.REACT_APP_BACKEND ?? "";
// const { merchant_uid, amount } = prepData;
// // 포트원 스크립트 로더 (한 번만 로드)
// function useIamport(scriptUrl = "https://cdn.iamport.kr/v1/iamport.js") {
//     const [ready, setReady] = useState(false);

//     useEffect(() => {
//         if (window.IMP) {
//             setReady(true);
//             return;
//         }
//         const s = document.createElement("script");
//         s.src = scriptUrl;
//         s.async = true;
//         s.onload = () => setReady(true);
//         s.onerror = () => setReady(false);
//         document.body.appendChild(s);
//         return () => {
//             // 스크립트 제거는 선택사항
//         };
//     }, [scriptUrl]);

//     return ready;
// }

// export default function PaymentButton() {
//     const [quantity, setQuantity] = useState(3);
//     const ready = useIamport();

//     // 토큰/헤더 (Principal을 쓰면 Authorization만 필요. 커스텀 헤더는 불필요)
//     const headers = useMemo(
//         () => ({
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
//         }),
//         []
//     );

//     const requestPay = useCallback(async () => {
//         try {
//             // 1) 사전검증 호출
//             const prepRes = await fetch(`${BACKEND}/api/payments/prepare`, {
//                 method: "POST",
//                 headers,
//                 body: JSON.stringify({ quantity }),
//             });

//             if (!prepRes.ok) {
//                 const msg = await prepRes.text();
//                 throw new Error(`사전검증 실패: ${msg}`);
//             }

//             // 서버가 {merchant_uid, amount, quantity} 형태로 준다고 가정
//             const prepData = await prepRes.json();

//             // 혹시 백엔드가 {result:{...}} 래핑이면 아래처럼 풀어주세요:
//             // const prepDataRaw = await prepRes.json();
//             // const prepData = prepDataRaw.result ?? prepDataRaw;

//             const { merchant_uid, amount } = prepData;

//             if (!ready || !window.IMP) {
//                 throw new Error("포트원 스크립트가 아직 로드되지 않았습니다.");
//             }

//             const IMP = window.IMP;
//             // 본인 가맹점 식별코드 (예: imp12345678) — .env로 관리 권장
//             IMP.init(process.env.REACT_APP_IAMPORT_MERCHANT || "");

//             // 2) 결제창 호출
//             IMP.request_pay(
//                 {
//                     pg: "html5_inicis.INIpayTest",
//                     pay_method: "card",
//                     merchant_uid,
//                     name: `${menu.menuName} x ${qty}`,
//                     amount,
//                     buyer_email: buyer.email,
//                     buyer_name: buyer.name,
//                     buyer_tel: buyer.tel,
//                 },
//                 async (rsp) => {
//                     if (!rsp) return;

//                     if (rsp.success) {
//                         try {
//                             // 3) 사후검증 호출
//                             const verifyRes = await fetch(`${BACKEND}/api/payments/verify`, {
//                                 method: "POST",
//                                 headers,
//                                 body: JSON.stringify({
//                                     imp_uid: rsp.imp_uid,
//                                     merchant_uid: rsp.merchant_uid,
//                                 }),
//                             });

//                             if (!verifyRes.ok) {
//                                 const msg = await verifyRes.text();
//                                 throw new Error(`사후검증 실패: ${msg}`);
//                             }

//                             // 검증 성공 처리
//                             alert("결제 성공 및 검증 완료!");
//                         } catch (e) {
//                             alert(e.message || "사후검증 중 오류");
//                         }
//                     } else {
//                         alert(`결제 실패: ${rsp.error_msg}`);
//                     }
//                 }
//             );
//         } catch (e) {
//             alert(e.message || "결제 준비 중 오류");
//             console.error(e);
//         }
//     }, [BACKEND, headers, quantity, ready]);

//     return (
//         <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
//             <label>
//                 수량
//                 <input
//                     type="number"
//                     min={1}
//                     value={quantity}
//                     onChange={(e) => setQuantity(Number(e.target.value))}
//                     style={{ marginLeft: 8 }}
//                 />
//             </label>

//             <button onClick={requestPay} disabled={!ready}>
//                 {ready ? "결제하기" : "로딩 중..."}
//             </button>
//         </div>
//     );
// }