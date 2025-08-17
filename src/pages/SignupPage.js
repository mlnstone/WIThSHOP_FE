// src/pages/SignupPage.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../services/api";

const pwRule = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*\W)(?!.*\s).{8,15}$/; // 숫자/영문/특수 1개+, 8~15
const birthRule = /^(?:\d{4}-\d{2}-\d{2}|\d{8})$/;                    // YYYY-MM-DD 또는 YYYYMMDD
const phoneRule = /^[0-9\-+]{8,20}$/;                                // 간단 형식 체크

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    birth: "",
    gender: "",  // "M" | "W"
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
    setError("");
  };

  const validate = () => {
    const fe = {};

    if (!form.email) fe.email = "이메일을 입력하세요.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) fe.email = "올바른 이메일 형식이 아닙니다.";

    if (!form.password) fe.password = "비밀번호를 입력하세요.";
    else if (!pwRule.test(form.password))
      fe.password = "비밀번호는 8~15자이며, 영문/숫자/특수문자를 각각 1개 이상 포함해야 합니다.";

    if (!form.confirmPassword) fe.confirmPassword = "비밀번호 확인을 입력하세요.";
    else if (form.password !== form.confirmPassword)
      fe.confirmPassword = "비밀번호가 일치하지 않습니다.";

    if (!form.name) fe.name = "이름을 입력하세요.";

    if (!form.birth) fe.birth = "생년월일을 입력하세요.";
    else if (!birthRule.test(form.birth))
      fe.birth = "생년월일은 YYYY-MM-DD 또는 YYYYMMDD 형식으로 입력하세요.";

    if (!form.gender) fe.gender = "성별을 선택하세요.";
    else if (!["M", "W"].includes(form.gender))
      fe.gender = "성별은 남성(M), 여성(W) 중 선택하세요.";

    if (!form.phone) fe.phone = "전화번호를 입력하세요.";
    else if (!phoneRule.test(form.phone))
      fe.phone = "전화번호 형식이 올바르지 않습니다.";

    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const parseBackendErrors = (data) => {
    const fe = {};
    if (data?.errors && Array.isArray(data.errors)) {
      for (const e of data.errors) {
        if (e.field) fe[e.field] = e.message || "유효하지 않은 값입니다.";
      }
    }
    setFieldErrors(fe);
  
    // data가 문자열이면 그대로 에러 표시
    if (typeof data === "string") {
      setError(data);
    } else {
      setError(data?.message || data?.error || "회원가입에 실패했습니다.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        birth: form.birth.trim(),
        gender: form.gender,       // "M" 또는 "W"
        phone: form.phone.trim(),
      };

      const { ok, data } = await apiFetch("/members/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!ok) {
        parseBackendErrors(data);
        return;
      }

      navigate("/login", { state: { signedUp: true, email: form.email } });
    } catch {
      setError("회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 560 }}>
      <h3 className="mb-3">회원가입</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="card p-3" onSubmit={onSubmit} noValidate>
        {/* 이메일 */}
        <div className="mb-3">
          <label className="form-label">이메일</label>
          <input
            name="email"
            type="email"
            className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            autoFocus
            required
          />
          {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
        </div>

        {/* 비밀번호 */}
        <div className="mb-3">
          <label className="form-label">비밀번호 (8~15자, 영문/숫자/특수 포함)</label>
          <input
            name="password"
            type="password"
            className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
            value={form.password}
            onChange={onChange}
            required
          />
          {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
        </div>

        {/* 비밀번호 확인 */}
        <div className="mb-3">
          <label className="form-label">비밀번호 확인</label>
          <input
            name="confirmPassword"
            type="password"
            className={`form-control ${fieldErrors.confirmPassword ? "is-invalid" : ""}`}
            value={form.confirmPassword}
            onChange={onChange}
            required
          />
          {fieldErrors.confirmPassword && <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>}
        </div>

        {/* 이름 */}
        <div className="mb-3">
          <label className="form-label">이름</label>
          <input
            name="name"
            className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
            value={form.name}
            onChange={onChange}
            required
          />
          {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
        </div>

        {/* 생년월일 */}
        <div className="mb-3">
          <label className="form-label">생년월일</label>
          <input
            name="birth"
            className={`form-control ${fieldErrors.birth ? "is-invalid" : ""}`}
            value={form.birth}
            onChange={onChange}
            placeholder="YYYY-MM-DD 또는 YYYYMMDD"
            required
          />
          {fieldErrors.birth && <div className="invalid-feedback">{fieldErrors.birth}</div>}
        </div>

        {/* 성별 */}
        <div className="mb-3">
          <label className="form-label d-block">성별</label>
          <div className="form-check form-check-inline">
            <input
              type="radio"
              id="genderM"
              name="gender"
              value="M"
              checked={form.gender === "M"}
              onChange={onChange}
              className={`form-check-input ${fieldErrors.gender ? "is-invalid" : ""}`}
            />
            <label htmlFor="genderM" className="form-check-label">남성</label>
          </div>
          <div className="form-check form-check-inline">
            <input
              type="radio"
              id="genderW"
              name="gender"
              value="W"
              checked={form.gender === "W"}
              onChange={onChange}
              className={`form-check-input ${fieldErrors.gender ? "is-invalid" : ""}`}
            />
            <label htmlFor="genderW" className="form-check-label">여성</label>
          </div>
          {fieldErrors.gender && <div className="invalid-feedback d-block">{fieldErrors.gender}</div>}
        </div>

        {/* 전화번호 */}
        <div className="mb-3">
          <label className="form-label">전화번호</label>
          <input
            name="phone"
            className={`form-control ${fieldErrors.phone ? "is-invalid" : ""}`}
            value={form.phone}
            onChange={onChange}
            placeholder="010xxxxxxxx"
            required
          />
          {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "가입 중..." : "회원가입"}
          </button>
          <Link className="btn btn-outline-secondary" to="/login">로그인으로</Link>
        </div>
      </form>
    </div>
  );
}