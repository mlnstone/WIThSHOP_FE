// src/pages/SignupPage.js
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../../services/api";
import "./SignupPage.css";

const pwRule = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*\W)(?!.*\s).{8,15}$/; // 숫자/영문/특수 1개+, 8~15
const birthRule = /^(?:\d{4}-\d{2}-\d{2}|\d{8})$/;                    // YYYY-MM-DD 또는 YYYYMMDD
const phoneRule = /^[0-9\-+]{8,20}$/;                                // 간단 형식 체크
const emailRule = /\S+@\S+\.\S+/;                                     // 간단 이메일 형식
const today = new Date().toISOString().slice(0, 10);
const minBirth = "1900-01-01";

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

  // 이메일 중복확인 상태
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);

  const navigate = useNavigate();

  // 이메일 형식 즉시검증: 값이 바뀌면 즉시 메시지 갱신
  const emailFormatValid = useMemo(
    () => (form.email ? emailRule.test(form.email) : false),
    [form.email]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => {
      const next = { ...fe, [name]: "" };

      // 이메일 형식 즉시 체크
      if (name === "email") {
        if (value && !emailRule.test(value)) next.email = "올바른 이메일 형식이 아닙니다.";
        else next.email = "";
        setEmailChecked(false);
        setEmailAvailable(false);
      }

      // 비밀번호 즉시 체크 (규칙만 확인)
      if (name === "password") {
        if (value && !pwRule.test(value)) {
          next.password = "비밀번호는 8~15자이며, 영문/숫자/특수문자를 각각 1개 이상 포함해야 합니다.";
        } else {
          next.password = "";
        }
        // 동시에 confirmPassword와 비교
        if (form.confirmPassword && value !== form.confirmPassword) {
          next.confirmPassword = "비밀번호가 일치하지 않습니다.";
        } else {
          next.confirmPassword = "";
        }
      }

      // 비밀번호 확인 즉시 체크
      if (name === "confirmPassword") {
        if (value && value !== form.password) {
          next.confirmPassword = "비밀번호가 일치하지 않습니다.";
        } else {
          next.confirmPassword = "";
        }
      }

      return next;
    });
    setError("");
  };

  const validate = () => {
    const fe = {};

    if (!form.email) fe.email = "이메일을 입력하세요.";
    else if (!emailRule.test(form.email)) fe.email = "올바른 이메일 형식이 아닙니다.";
    else if (!emailChecked) fe.email = "이메일 중복 확인을 해주세요.";
    else if (!emailAvailable) fe.email = "이미 사용 중인 이메일입니다.";

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
    setError(typeof data === "string" ? data : (data?.message || data?.error || "회원가입에 실패했습니다."));
  };

  const onCheckEmail = async () => {
    if (!form.email) return alert("이메일을 입력하세요.");
    if (!emailRule.test(form.email)) return alert("올바른 이메일 형식이 아닙니다.");

    setEmailChecking(true);
    try {
      const { ok, data } = await apiFetch(`/members/check-email?email=${encodeURIComponent(form.email.trim())}`);
      if (!ok) return alert("중복 확인 중 오류가 발생했습니다.");
      setEmailChecked(true);
      setEmailAvailable(!!data?.available);
      alert(data?.available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다.");
    } catch {
      alert("중복 확인 중 오류가 발생했습니다.");
    } finally {
      setEmailChecking(false);
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
        gender: form.gender,
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
    <div className="signup-sheet">
      <div className="login-header">
        <Link to="/" className="logo-btn">WIThSHOP</Link>
      </div>

      {error && <div className="signup-alert">{error}</div>}

      <form className="signup-form" onSubmit={onSubmit} noValidate>
        {/* 이메일 */}
        <label className="signup-label">이메일</label>
        <div className={`line-input email-check-row ${fieldErrors.email ? "is-error" : ""}`}>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="이메일을 입력하세요"
            autoFocus
            required
          />
          <button
            type="button"
            className="check-btn"
            onClick={onCheckEmail}
            disabled={emailChecking || !emailFormatValid}
            title={!emailFormatValid && form.email ? "올바른 이메일 형식이 아닙니다." : undefined}
          >
            {emailChecking ? "확인 중..." : emailChecked ? (emailAvailable ? "사용 가능" : "사용 불가") : "중복 확인"}
          </button>
        </div>
        {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}

        {/* 비밀번호 */}
        <label className="signup-label mt-3">비밀번호 (8~15자, 영문/숫자/특수 포함)</label>
        <div className={`line-input ${fieldErrors.password ? "is-error" : ""}`}>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>
        {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}

        {/* 비밀번호 확인 */}
        <label className="signup-label mt-3">비밀번호 확인</label>
        <div className={`line-input ${fieldErrors.confirmPassword ? "is-error" : ""}`}>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
        </div>
        {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}

        {/* 이름 */}
        <label className="signup-label mt-3">이름</label>
        <div className={`line-input ${fieldErrors.name ? "is-error" : ""}`}>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="이름을 입력하세요"
            required
          />
        </div>
        {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}

        {/* 생년월일 */}
        <label className="signup-label mt-3">생년월일</label>
        <div className={`line-input ${fieldErrors.birth ? "is-error" : ""}`}>
          <input
            name="birth"
            type="date"
            value={form.birth}
            onChange={onChange}
            required
            min={minBirth}
            max={today}
          />
        </div>
        {fieldErrors.birth && <div className="field-error">{fieldErrors.birth}</div>}

        {/* 전화번호 */}
        <label className="signup-label mt-3">전화번호</label>
        <div className={`line-input ${fieldErrors.phone ? "is-error" : ""}`}>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="전화번호를 입력하세요"
            required
          />
        </div>
        {fieldErrors.phone && <div className="field-error">{fieldErrors.phone}</div>}

        {/* 성별 */}
        <label className="signup-label mt-3">성별</label>
        <div className="gender-row">
          <label className="radio">
            <input
              type="radio"
              name="gender"
              value="M"
              checked={form.gender === "M"}
              onChange={onChange}
            />
            <span>남성</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="gender"
              value="W"
              checked={form.gender === "W"}
              onChange={onChange}
            />
            <span>여성</span>
          </label>
        </div>
        {fieldErrors.gender && <div className="field-error">{fieldErrors.gender}</div>}

        {/* 버튼 */}
        <div className="btn-row">
          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "가입 중..." : "회원가입"}
          </button>
          <Link className="ghost-btn" to="/login">로그인으로</Link>
        </div>
      </form>
    </div>
  );
}