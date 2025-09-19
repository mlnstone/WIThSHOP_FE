// src/pages/ProfileSetupPage.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";
import useUser from "../../hooks/useUser";

const birthRule = /^(?:\d{4}-\d{2}-\d{2}|\d{8})$/;
const phoneRule = /^[0-9\-+]{8,20}$/;

export default function ProfileSetupPage() {
  const [form, setForm] = useState({
    name: "",
    birth: "",
    gender: "", // "M" | "W"
    phone: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 약관 동의 상태
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeService, setAgreeService] = useState(false); // (필수)
  const [showTerms, setShowTerms] = useState(false);
  const [termsError, setTermsError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { refreshMe } = useUser();

  // 이미 완료한 사용자는 접근 막기 + 쿼리 토큰 흡수
  useEffect(() => {
    // 1) /profile-setup?accessToken=...&refreshToken=... 으로 들어온 경우 토큰 저장
    const qs = new URLSearchParams(location.search);
    const accessToken = qs.get("accessToken");
    const refreshToken = qs.get("refreshToken");
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (accessToken || refreshToken) {
      // 주소 정리 (쿼리 제거)
      window.history.replaceState({}, "", location.pathname);
    }

    // 2) 내 프로필 확인해서 이미 완료면 홈으로
    (async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      const { ok, data } = await apiFetch("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoading(false);
      if (!ok) {
        navigate("/", { replace: true });
        return;
      }
      const done = data?.userName && data?.birth && data?.gender && data?.phone;
      if (done) {
        navigate("/", { replace: true });
      }
    })();
  }, [location, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
    setError("");
  };

  // 약관 체크 로직
  const toggleAgreeAll = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeService(next);
    setTermsError("");
  };
  const toggleAgreeService = () => {
    const next = !agreeService;
    setAgreeService(next);
    setAgreeAll(next); // 필수 하나뿐이므로 동기화
    if (next) setTermsError("");
  };

  const validate = () => {
    const fe = {};
    if (!form.name) fe.name = "이름을 입력하세요.";
    if (!form.birth) fe.birth = "생년월일을 입력하세요.";
    else if (!birthRule.test(form.birth)) fe.birth = "YYYY-MM-DD 또는 YYYYMMDD 형식";
    if (!form.gender) fe.gender = "성별을 선택하세요.";
    if (!form.phone) fe.phone = "전화번호를 입력하세요.";
    else if (!phoneRule.test(form.phone)) fe.phone = "전화번호 형식이 올바르지 않습니다.";
    setFieldErrors(fe);

    // 약관 (필수)
    if (!agreeService) {
      setTermsError("WIThSHOP 이용 약관(필수)에 동의해 주세요.");
    } else {
      setTermsError("");
    }

    return Object.keys(fe).length === 0 && agreeService;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken");
      const payload = {
        name: form.name.trim(),
        birth: form.birth.trim(),
        gender: form.gender,
        phone: form.phone.trim(),
      };

      const { ok, data } = await apiFetch("/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!ok) {
        if (typeof data === "string") setError(data);
        else setError(data?.message || data?.error || "프로필 설정에 실패했습니다.");
        return;
      }

      await refreshMe();

      alert("프로필이 저장되었습니다!");
      window.location.href = "/";

      navigate("/", {
        replace: true,
        state: { profileCompleted: true, bypassProfileGateOnce: true },
      });
    } catch {
      setError("프로필 설정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container py-4">확인 중…</div>;

  return (
    <div className="container py-4" style={{ maxWidth: 560 }}>
      <h3 className="mb-3">프로필 최초 설정</h3>
      <p className="text-muted">이름, 생년월일, 성별, 전화번호를 한 번만 설정합니다.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="card p-3" onSubmit={onSubmit} noValidate>
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

        <div className="mb-3">
          <label className="form-label">전화번호</label>
          <input
            name="phone"
            className={`form-control ${fieldErrors.phone ? "is-invalid" : ""}`}
            value={form.phone}
            onChange={onChange}
            placeholder="010-1234-5678"
            required
          />
          {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
        </div>

        {/* ===== 약관 동의 블록 (전화번호 아래, 저장 위) ===== */}
        <div className="mb-3 border rounded p-3 bg-light">
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="agreeAll"
              checked={agreeAll}
              onChange={toggleAgreeAll}
            />
            <label className="form-check-label fw-semibold" htmlFor="agreeAll">
              모든 약관에 동의합니다.
            </label>
          </div>

          <div className="d-flex justify-content-between align-items-start">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreeService"
                checked={agreeService}
                onChange={toggleAgreeService}
              />
              <label className="form-check-label" htmlFor="agreeService">
                WIThSHOP 이용 약관에 동의합니다.&nbsp;
                <span className="text-primary fw-semibold">(필수)</span>
              </label>
            </div>

            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => setShowTerms((s) => !s)}
              aria-expanded={showTerms}
              aria-controls="termsDetails"
            >
              상세보기 {showTerms ? "▴" : "▾"}
            </button>
          </div>

          {showTerms && (
            <div id="termsDetails" className="mt-2 small text-muted">
              <div className="border rounded p-2 bg-white">
                <strong>WIThSHOP 개인정보 수집·이용 안내(요약)</strong>
                <ul className="mb-1 mt-2">
                  <li>수집 항목: 이름, 생년월일, 성별, 전화번호</li>
                  <li>수집 목적: 본인 확인, 회원 관리, 고객 지원</li>
                  <li>보관 기간: 회원 탈퇴 시까지 또는 관련 법령에 따른 기간</li>
                  <li>동의 거부 권리: 동의하지 않을 수 있으나, 서비스 이용이 제한될 수 있습니다.</li>
                </ul>
                전체 약관은 추후 “약관 전문” 페이지에서 확인하실 수 있습니다.
              </div>
            </div>
          )}

          {termsError && <div className="text-danger mt-2">{termsError}</div>}
        </div>
        {/* ===== 약관 동의 블록 끝 ===== */}

        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </form>
    </div>
  );
}