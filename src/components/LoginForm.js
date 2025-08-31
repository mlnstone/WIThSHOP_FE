import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./LoginForm.css";

const BACKEND = process.env.REACT_APP_BACKEND;

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 돌아갈 곳
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
      const res = await fetch("/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("로그인 실패");

      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.removeItem("displayName");

      // 로그인 직후 이름 미리 캐시
      try {
        const meRes = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${data.accessToken}` }
        });
        const me = await meRes.json();
        const name = me?.userName || me?.name;
        if (name) localStorage.setItem("displayName", name);
      } catch { /* 네트워크 실패 시 무시 */ }

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
    <form onSubmit={handleSubmit} className="login-sheet">
      <h3 className="login-title">로그인</h3>

      {/* 이메일 */}
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

      {/* 비밀번호 */}
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

      {/* 로그인 버튼 */}
      <button
        type="submit"
        className={`login-main-btn ${canSubmit ? "" : "disabled"}`}
        disabled={!canSubmit}
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      {/* 하단 링크 */}
      <div className="login-links">
        <a href="/signup">회원가입</a>
        <span className="divider" />
        <button type="button" className="link-btn" onClick={onFindPassword}>
          비밀번호 찾기
        </button>
      </div>

      {/* 소셜 로그인 (Google) */}
      <a className="google-btn" href={googleLoginHref}>
        Google 로그인
      </a>
    </form>
  );
}