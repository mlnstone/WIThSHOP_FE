// src/pages/auth/MyPage.js
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";
import { Link, useLocation } from "react-router-dom";
import MySidebar from "../../components/me/Sidebar";

export default function MyPage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state } = useLocation();

  // ✅ 추가: 포인트/쿠폰
  const [pointLoading, setPointLoading] = useState(true);
  const [pointBalance, setPointBalance] = useState(0);

  const [couponLoading, setCouponLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [couponOpen, setCouponOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }

    const controller = new AbortController();
    apiFetch("/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(({ data }) => setMe(data || null))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  // ✅ 내 포인트
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setPointLoading(false); return; }
    const controller = new AbortController();
    setPointLoading(true);
    apiFetch("/points", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (res?.ok && typeof res?.data?.balance === "number") {
          setPointBalance(res.data.balance);
        } else {
          setPointBalance(0);
        }
      })
      .finally(() => setPointLoading(false));
    return () => controller.abort();
  }, []);

  // ✅ 내 쿠폰 목록
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setCouponLoading(false); return; }
    const controller = new AbortController();
    setCouponLoading(true);
    apiFetch("/coupons", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (res?.ok && Array.isArray(res?.data)) setCoupons(res.data);
        else setCoupons([]);
      })
      .finally(() => setCouponLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <div className="container py-4">불러오는 중...</div>;
  if (!me) return <div className="container py-4">로그인이 필요합니다.</div>;

  // 가입일: 날짜만
  const joined = me.userCreatedAt ? me.userCreatedAt.split("T")[0] : "-";

  // 생년월일 포맷: 20000308 -> 2000/03/08, 이미 YYYY-MM-DD면 /로 변경
  const formatBirth = (b) => {
    if (!b) return "-";
    if (/^\d{8}$/.test(b)) return `${b.slice(0,4)}/${b.slice(4,6)}/${b.slice(6,8)}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(b)) return b.replaceAll("-", "/");
    return b;
  };

  const couponCount = coupons.length;

  return (
    <div className="container py-4">
      <div className="row g-3">
        {/* 왼쪽: 사이드바 (2) */}
        <div className="col-12 col-md-2">
          <MySidebar />
        </div>

        {/* 오른쪽: 본문 (10) */}
        <div className="col-12 col-md-10">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="m-0">마이페이지</h3>

            <div className="d-flex gap-2">
              {/* 비번 변경(LOCAL만) */}
              {me.userProvider === "LOCAL" && (
                <Link
                  to="/me/password"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                >
                  비밀번호 변경
                </Link>
              )}
            </div>
          </div>

          {state?.pwChanged && (
            <div className="alert alert-success">비밀번호가 변경되었습니다.</div>
          )}

          {/* 기본 정보 카드 */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="fw-bold mb-3" style={{ fontSize: 18 }}>
                {me.userName ?? "-"}
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="mb-2"><strong>이름</strong> : {me.userName ?? "-"}</div>
                  <div className="mb-2"><strong>이메일</strong> : {me.userEmail ?? "-"}</div>
                  <div className="mb-2"><strong>전화번호</strong> : {me.phone ?? "-"}</div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="mb-2"><strong>생년월일</strong> : {formatBirth(me.birth)}</div>
                  <div className="mb-2"><strong>성별</strong> : {me.gender ?? "-"}</div>
                  <div className="mb-2"><strong>가입일</strong> : {joined}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ 포인트 / 쿠폰 카드 두 개 (화면에 빨간 박스 자리) */}
          <div className="row g-3">
            {/* 내 포인트 */}
            <div className="col-12 col-md-6">
              <div className="card h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="fw-semibold">내 포인트</div>
                  </div>
                  <div className="mt-3">
                    {pointLoading ? (
                      <div className="text-muted">불러오는 중…</div>
                    ) : (
                      <div className="display-6">
                        {pointBalance.toLocaleString()} <span className="fs-6">P</span>
                      </div>
                    )}
                  </div>
                  <div className="text-muted small mt-2">주문 결제 시 사용 가능합니다.</div>
                </div>
              </div>
            </div>

            {/* 보유 쿠폰 */}
            <div className="col-12 col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="fw-semibold">보유 쿠폰</div>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setCouponOpen((v) => !v)}
                      disabled={couponLoading}
                    >
                      {couponLoading ? "불러오는 중…" : `${couponCount}장 보기`}
                    </button>
                  </div>

                  {/* 접기/펼치기 목록 */}
                  {couponOpen && !couponLoading && (
                    <div className="mt-3">
                      {couponCount === 0 ? (
                        <div className="text-muted">보유한 쿠폰이 없습니다.</div>
                      ) : (
                        <ul className="list-group">
                          {coupons.map((c) => (
                            <li key={c.userCouponId ?? c.id} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-semibold">{c.couponName ?? c.name}</div>
                                  <div className="small text-muted">
                                    {c.discountType === "PERCENT"
                                      ? `${c.discount}%`
                                      : `${(c.discount ?? 0).toLocaleString()}원`}{" "}
                                    할인
                                    {c.code ? ` · 코드: ${c.code}` : ""}
                                    {c.limitAt ? ` · 만료: ${String(c.limitAt).split("T")[0]}` : ""}
                                  </div>
                                </div>
                                <span
                                  className={`badge rounded-pill ${
                                    c.isUsed === "USED" ? "text-bg-secondary" : "text-bg-dark"
                                  }`}
                                >
                                  {c.isUsed === "USED" ? "사용완료" : "미사용"}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}