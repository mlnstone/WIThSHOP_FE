// src/pages/MyPage.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { Link, useLocation } from "react-router-dom";

export default function MyPage() {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const { state } = useLocation(); // 성공 메시지 받기용

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) { setLoading(false); return; }

        const controller = new AbortController();
        apiFetch("/api/me", {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
        })
            .then(({ data }) => setMe(data || null))
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, []);

    if (loading) return <div className="container py-4">불러오는 중…</div>;
    if (!me) return <div className="container py-4">로그인이 필요합니다.</div>;

    const joined = me.userCreatedAt
        ? me.userCreatedAt.replace("T", " ").slice(0, 16)
        : "-";

    return (
        <div className="container py-4" style={{ maxWidth: 720 }}>
            <h3 className="mb-3">마이페이지</h3>

            {state?.pwChanged && (
                <div className="alert alert-success">비밀번호가 변경되었습니다.</div>
            )}

            <div className="card mb-3">
                <div className="card-body">
                    <div className="mb-2"><strong>이름</strong> : {me.userName ?? "-"}</div>
                    <div className="mb-2"><strong>이메일</strong> : {me.userEmail ?? "-"}</div>
                    <div className="mb-2"><strong>전화번호</strong> : {me.phone ?? "-"}</div>
                    <div className="mb-2"><strong>생년월일</strong> : {me.birth ?? "-"}</div>
                    <div className="mb-2"><strong>성별</strong> : {me.gender ?? "-"}</div>
                    <div className="mb-2"><strong>가입일</strong> : {joined}</div>
                </div>
            </div>

            {/* 비밀번호 변경 버튼 */}
            {me.userProvider === "LOCAL" && (
                <Link to="/me/password" className="btn btn-outline-primary">
                    비밀번호 변경
                </Link>
            )}
        </div>
    );
}