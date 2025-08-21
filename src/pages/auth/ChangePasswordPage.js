// src/pages/ChangePasswordPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

export default function ChangePasswordPage() {
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // 기본 프론트 유효성
        if (!currentPw || !newPw) {
            setError("현재 비밀번호와 새 비밀번호를 입력하세요.");
            return;
        }
        if (newPw.length < 8 || newPw.length > 15) {
            setError("새 비밀번호는 8자 이상 15자 이하여야 합니다.");
            return;
        }
        if (newPw !== confirmPw) {
            setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem("accessToken");

            const { ok, status, data } = await apiFetch("/api/me/password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPw, newPw }),
            });

            if (!ok) {
                // 1) 서버가 내려준 메시지 후보들 중 하나 집계
                let raw =
                    (data && (data.message || data.error)) ||
                    (data && data.errors && (data.errors[0]?.defaultMessage || data.errors[0]?.message)) ||
                    (status === 401 ? "인증이 필요합니다." : "비밀번호 변경에 실패했습니다.");

                // 2) "필드명 (메시지)" 형식을 "메시지"만 남기도록 정리
                //    예: "newPw (비밀번호는 ... 포함해야 합니다.)" -> "비밀번호는 ... 포함해야 합니다."
                const prettify = (msg) => {
                    if (typeof msg !== "string") return "요청이 올바르지 않습니다.";
                    // 앞에 영문/숫자/밑줄로 된 필드명 + 공백 + ( ... ) 형태를 잡아 메시지만 남김
                    const m = msg.match(/^[a-zA-Z0-9_]+\s*\((.*)\)\s*$/);
                    return m ? m[1] : msg;
                };

                throw new Error(prettify(raw));
            }

            navigate("/me", { state: { pwChanged: true } });
        } catch (err) {
            setError(err.message || "비밀번호 변경에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container py-4" style={{ maxWidth: 520 }}>
            <h3 className="mb-3">비밀번호 변경</h3>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={onSubmit} className="card p-3">
                <div className="mb-3">
                    <label className="form-label">현재 비밀번호</label>
                    <input
                        type="password"
                        className="form-control"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        autoFocus
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">새 비밀번호 (8~15자)</label>
                    <input
                        type="password"
                        className="form-control"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        required
                        minLength={8}
                        maxLength={15} 
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">새 비밀번호 확인</label>
                    <input
                        type="password"
                        className="form-control"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        required
                        minLength={8}
                        maxLength={15}   // ✅ 추가
                    />
                </div>

                <div className="d-flex gap-2">
                    <button className="btn btn-primary" type="submit" disabled={submitting}>
                        {submitting ? "변경 중..." : "변경하기"}
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => navigate(-1)}
                        disabled={submitting}
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}