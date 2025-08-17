import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

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
  const navigate = useNavigate();

  // 이미 완료한 사용자는 접근 막기
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) { navigate("/login", { replace: true }); return; }
      const { ok, data } = await apiFetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoading(false);
      if (!ok) { navigate("/", { replace: true }); return; }

      const done = data?.userName && data?.birth && data?.gender && data?.phone;
      if (done) navigate("/", { replace: true });
    })();
  }, [navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
    setError("");
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
    return Object.keys(fe).length === 0;
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
      const { ok, data } = await apiFetch("/api/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!ok) {
        // 백엔드 표준 에러 표시
        if (typeof data === "string") setError(data);
        else setError(data?.message || data?.error || "프로필 설정에 실패했습니다.");
        return;
      }
      // 성공 → 홈(또는 마이페이지)
      navigate("/", { replace: true, state: { profileCompleted: true } });
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

        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </form>
    </div>
  );
}