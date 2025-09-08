// src/components/login/LoginForm.js (경로는 프로젝트 구조에 맞게)
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./LoginForm.css";
import { apiFetch, BACKEND } from "../services/api"; // ✅ 추가

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    const s = location.state?.from;
    if (typeof s === "string" && s) return s;
    const q = new URLSearchParams(location.search);
    return q.get("from") || "/";
  }, [location]);

  const googleLoginHref = useMemo(() => {
    const url = new URL(`${BACKEND}/oauth2/authorization/google`);
    if (from) url.searchParams.set("from", from);
    return url.toString();
  }, [from]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);

      const { ok, data } = await apiFetch("/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!ok) throw new Error("로그인 실패");

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.removeItem("displayName");

      // 로그인 직후 이름 미리 캐시
      try {
        const meRes = await apiFetch("/api/me", {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        const me = meRes.data;
        const name = me?.userName || me?.name;
        if (name) localStorage.setItem("displayName", name);
      } catch { /* ignore */ }

      navigate(from, { replace: true });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("아이디 또는 비밀번호가 잘못되었습니다.");
    } finally {
      setLoading(false);
    }
  }

  function onFindPassword() {
    alert("개발 예정입니다.");
  }

  const canSubmit = !!email && !!password && !loading;

  return (
    <div className="login-page">
      <div className="login-header">
        <Link to="/" className="logo-btn">WIThSHOP</Link>
      </div>

      <form onSubmit={handleSubmit} className="login-sheet">
        <label className="login-label">이메일</label>
        <div className="line-input">
          <input
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <label className="login-label mt-3">비밀번호</label>
        <div className="line-input with-icon">
          <input
            type={showPw ? "text" : "password"}
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="ghost-icon"
            aria-label="비밀번호 보기 전환"
            onClick={() => setShowPw((v) => !v)}
          >
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          type="submit"
          className={`login-main-btn ${canSubmit ? "" : "disabled"}`}
          disabled={!canSubmit}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <div className="login-links">
          <a href="/signup">회원가입</a>
          <span className="divider" />
          <button type="button" className="link-btn" onClick={onFindPassword}>
            비밀번호 찾기
          </button>
        </div>

        <a className="google-btn" href={googleLoginHref}>
          Google 로그인
        </a>
      </form>
    </div>
  );
}