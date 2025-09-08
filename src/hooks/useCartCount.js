// src/hooks/useCartCount.js
import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

/** ----- 싱글톤 상태 (모든 컴포넌트 공유) ----- */
let subscribers = new Set();           // 상태 구독자
let currentCount = 0;                  // 공유 카운트
let inFlight = null;                   // 진행 중 fetch Promise
let lastFetchAt = 0;                   // 마지막 실 fetch 시간
let listenersInstalled = false;        // 전역 이벤트 리스너 1회만
let bc = null;                         // BroadcastChannel(옵션)

/** 환경 */
const MIN_INTERVAL = 3000;             // fetch 최소 간격(과도한 폭주 방지)
const DEBOUNCE = 150;                  // 이벤트 디바운스

let debounceTimer = null;
function scheduleRefresh() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => refresh(true), DEBOUNCE);
}

/** 실제 네트워크 호출(중복 합치기 + 최소 간격) */
async function fetchCount() {
  if (inFlight) return inFlight;

  const now = Date.now();
  if (now - lastFetchAt < MIN_INTERVAL) return currentCount;

  lastFetchAt = now;

  inFlight = apiFetch("/cart/count", { cache: "no-store" })
    .then(({ ok, data }) => {
      if (!ok) return currentCount;
      if (typeof data === "number") return data;
      if (typeof data?.count === "number") return data.count;
      return 0;
    })
    .catch(() => currentCount)
    .finally(() => { inFlight = null; });

  return inFlight;
}

/** 공유 refresh: 구독자에게 브로드캐스트 */
async function refresh(force = false) {
  if (!force && Date.now() - lastFetchAt < MIN_INTERVAL) return currentCount;

  const n = await fetchCount();
  if (n === currentCount) return n;
  currentCount = n;

  try { localStorage.setItem("__cartLineCount__", String(n)); } catch {}
  try { bc && bc.postMessage({ type: "set" }); } catch {}

  subscribers.forEach(setter => setter(currentCount));
  return n;
}

/** 전역 이벤트 리스너: 탭 복귀/스토리지 변경 시만 디바운스 재조회 */
function ensureGlobalListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;

  try { bc = new BroadcastChannel("cartLine"); } catch { bc = null; }

  const onFocus = () => scheduleRefresh();
  const onVis = () => { if (document.visibilityState === "visible") scheduleRefresh(); };
  const onStorage = (e) => {
    if (e.key === "__cartLineCount__" || e.key === "__cartCount__") scheduleRefresh();
  };
  const onMsg = () => scheduleRefresh();

  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("storage", onStorage);
  bc && bc.addEventListener("message", onMsg);

  window.__CART_COUNT_CLEANUP__ = () => {
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("storage", onStorage);
    bc && bc.removeEventListener("message", onMsg);
    bc && bc.close();
    bc = null;
    listenersInstalled = false;
  };
}

/** ----- 공개 훅 ----- */
export default function useCartCount() {
  const [count, setCount] = useState(() => {
    const cached = Number(localStorage.getItem("__cartLineCount__"));
    return Number.isFinite(cached) ? cached : currentCount;
  });

  useEffect(() => {
    ensureGlobalListeners();
    subscribers.add(setCount);

    refresh(true); // 첫 렌더에서 동기화

    return () => {
      subscribers.delete(setCount);
      if (subscribers.size === 0 && window.__CART_COUNT_CLEANUP__) {
        // window.__CART_COUNT_CLEANUP__(); // 필요 시 해제
      }
    };
  }, []);

  return count;
}

/** 외부(장바구니 추가/삭제 등)에서 호출해 갱신 */
export async function syncCartBadge() {
  return refresh(true);
}