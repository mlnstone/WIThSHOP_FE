// src/components/LoginForm.jsx
import React, { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch("/members/login", { // ← 여기만 변경
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("로그인 실패");
      const data = await res.json();

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("로그인에 실패했습니다.");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: 320 }} className="p-4 border rounded bg-white">
      <h3 className="mb-3 text-center">로그인</h3>

      <div className="mb-3">
        <label className="form-label">이메일</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">비밀번호</label>
        <input
          type="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary w-100">로그인</button>
    </form>
  );
}