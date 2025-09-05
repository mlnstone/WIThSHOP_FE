import React, { useEffect, useState } from "react";

/**
 * 무이자 할부 안내 모달
 * - 우선 /config/installments 에서 받아오고
 * - 실패하면 로컬 기본안내로 폴백
 *
 * props:
 *  - open: boolean (표시 여부)
 *  - onClose: () => void (닫기)
 */
export default function InstallmentInfo({ open, onClose }) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!open) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/config/installments");
        if (r.ok) {
          const json = await r.json().catch(() => null);
          if (alive && Array.isArray(json)) {
            setPlans(json);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      // 폴백 데이터
      if (alive) {
        setPlans([
          { card: "국민", months: [2, 3] },
          { card: "신한", months: [2, 3, 6] },
          { card: "현대", months: [2, 3] },
          { card: "롯데", months: [2, 3, 6] },
          { card: "삼성", months: [2, 3] },
          { card: "우리", months: [2, 3] },
        ]);
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="installment-modal-overlay" onClick={onClose}>
      <div className="installment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="installment-header">
          <h5 className="title">무이자 할부 안내</h5>
          <button className="close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div className="installment-body">
          {loading ? (
            <div className="muted">불러오는 중...</div>
          ) : plans.length === 0 ? (
            <div className="muted">현재 제공되는 무이자 할부 정보가 없습니다.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{width: 140}}>카드사</th>
                  <th>무이자 개월</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p, i) => (
                  <tr key={i}>
                    <td>{p.card}</td>
                    <td>
                      {Array.isArray(p.months) && p.months.length > 0
                        ? p.months.join(", ") + "개월"
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <ul className="notes">
            <li>행사 내용 및 대상은 카드사 정책에 따라 변경될 수 있습니다.</li>
            <li>일부 상품은 무이자 대상에서 제외될 수 있습니다.</li>
          </ul>
        </div>

        <div className="installment-footer">
          <button className="btn" onClick={onClose}>닫기</button>
        </div>
      </div>

      {/* 최소 스타일 */}
      <style>{`
        .installment-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999}
        .installment-modal{width:min(720px,92vw);background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,.18)}
        .installment-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee}
        .installment-header .title{margin:0;font-size:16px;font-weight:700}
        .installment-header .close{border:0;background:transparent;font-size:22px;cursor:pointer;line-height:1}
        .installment-body{padding:16px}
        .muted{color:#666}
        .table{width:100%;border-collapse:collapse}
        .table th,.table td{padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:left}
        .notes{margin:12px 0 0 16px;color:#666;font-size:13px}
        .installment-footer{padding:12px 16px;border-top:1px solid #eee;display:flex;justify-content:flex-end}
        .btn{border:1px solid #ddd;background:#111827;color:#fff;border-radius:8px;padding:8px 14px;cursor:pointer}
      `}</style>
    </div>
  );
}