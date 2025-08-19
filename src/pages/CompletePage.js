// src/pages/CompletePage.jsx
import { useEffect, useRef, useState } from "react";

export default function CompletePage() {
  const [seconds, setSeconds] = useState(2);   // 안내 카운트다운 (선택)
  const timerRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    // 1) 2초 뒤 강제 새로고침 + 홈 이동
    timerRef.current = setTimeout(() => {
      // 전체 페이지 리로드 + "/"로 이동 (히스토리에 /complete 남기지 않음)
      window.location.replace("/");
    }, 2000);

    // 2) 안내용 카운트다운 (선택)
    tickRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(tickRef.current);
    };
  }, []);

  const goHomeSoft = () => {
    // 새로고침 없이 SPA 내에서만 이동하고 싶을 때 (대안 버튼)
    // window.location.assign("/")로 바꾸면 히스토리에 기록됨
    window.location.replace("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: 56 }}>
      <h2>프로필 설정이 완료되었습니다 ✅</h2>
      <p>{seconds}초 후 메인으로 이동합니다.</p>
      <button
        onClick={goHomeSoft}
        style={{ marginTop: 20, padding: "10px 20px" }}
      >
        지금 바로 이동
      </button>
    </div>
  );
}