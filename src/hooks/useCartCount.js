// src/hooks/useCartCount.js
import { useCallback, useEffect, useMemo, useState } from "react";

export default function useCartCount({ enabled = true, refetchOnFocus = true } = {}) {
  const [count, setCount] = useState(0);

  // ✅ 레거시와 분리된 새 키/채널/이벤트
  const LS_KEY = "__cartLineCount__";
  const CHANNEL = "cartLine";
  const EVT_SET = "cartLine:set";   // payload 안 씀(무시)

  const bc = useMemo(() => {
    try { return new BroadcastChannel(CHANNEL); } catch { return null; }
  }, []);

  const fetchCartLineCount = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    const headers = token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Cache-Control": "no-store" }
      : { "Content-Type": "application/json", "Cache-Control": "no-store" };

    try {
      // 캐시 바이패스(혹시 프록시 캐시가 있으면 쿼리 스트링 추가)
      const r = await fetch(`/cart/count?_=${Date.now()}`, { headers, cache: "no-store" });
      if (!r.ok) return 0;
      const n = await r.json();
      return typeof n === "number" && Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const c = await fetchCartLineCount();
    setCount(c);
    try { localStorage.setItem(LS_KEY, String(c)); } catch {}
    try { bc && bc.postMessage({ type: "set" }); } catch {}
  }, [enabled, fetchCartLineCount, bc]);

  useEffect(() => {
    if (!enabled) return;

    // 초기 캐시 보여주고 바로 서버값으로 교정
    try {
      const cached = Number(localStorage.getItem(LS_KEY));
      if (!Number.isNaN(cached)) setCount(cached);
    } catch {}
    refresh();

    // ❗ 외부 신호는 값 무시 → 항상 재조회만
    const onSet = () => { refresh(); };

    // 새 이벤트만 수신
    window.addEventListener(EVT_SET, onSet);

    // 브로드캐스트 채널도 타입만 보고 재조회
    const onMsg = () => { refresh(); };
    bc && bc.addEventListener("message", onMsg);

    // 스토리지 변경 → 재조회
    const onStorage = (ev) => {
      if (ev.key === LS_KEY || ev.key === "__cartCount__") refresh(); // 레거시 키도 방어
    };
    window.addEventListener("storage", onStorage);

    // 화면 복귀 시 재조회
    const onFocus = () => refetchOnFocus && refresh();
    window.addEventListener("focus", onFocus);
    const onVisible = () => {
      if (refetchOnFocus && document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener(EVT_SET, onSet);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      bc && bc.removeEventListener("message", onMsg);
      bc && bc.close();
    };
  }, [enabled, refetchOnFocus, bc, refresh]);

  return count;
}