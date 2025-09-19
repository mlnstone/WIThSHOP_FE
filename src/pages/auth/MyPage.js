// src/pages/auth/MyPage.js
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";
import { Link, useLocation } from "react-router-dom";
import MySidebar from "../../components/me/Sidebar";

export default function MyPage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state } = useLocation();

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
              {/* 비번 변경(LOCAL만) — 은은한 스타일 */}
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

          <div className="card">
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

        </div>
      </div>
    </div>
  );
}