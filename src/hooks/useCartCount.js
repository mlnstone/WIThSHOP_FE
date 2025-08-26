// src/hooks/useCartCount.js
import { useEffect, useState } from "react";

/** ----- 싱글톤 상태 (모든 컴포넌트 공유) ----- */
let subscribers = new Set();           // 상태 구독자
let currentCount = 0;                  // 공유 카운트
let inFlight = null;                   // 진행 중 fetch Promise
let lastFetchAt = 0;                   // 마지막 실 fetch 시간
let listenersInstalled = false;        // 전역 이벤트 리스너 1회만
let bc = null;                         // BroadcastChannel(옵션)

/** 환경 */
const BASE = ""; 
const MIN_INTERVAL = 3000;             // fetch 최소 간격(과도한 폭주 방지)
const DEBOUNCE = 150;                  // 이벤트 디바운스

let debounceTimer = null;
function scheduleRefresh() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => refresh(true), DEBOUNCE);
}

/** 실제 네트워크 호출(중복 합치기 + 최소 간격) */
async function fetchCount() {
  // 진행 중이면 그거 재사용
  if (inFlight) return inFlight;

  // 너무 촘촘하면 그냥 현재값 반환
  const now = Date.now();
  if (now - lastFetchAt < MIN_INTERVAL) return currentCount;

  lastFetchAt = now;
  const token = localStorage.getItem("accessToken");
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" }
    : { "Cache-Control": "no-store" };

  inFlight = fetch(`${BASE}/cart/count`, { headers, cache: "no-store" })
    .then(r => (r.ok ? r.json() : 0))
    .then(n => (Number.isFinite(n) ? n : 0))
    .catch(() => currentCount)
    .finally(() => { inFlight = null; });

  return inFlight;
}

/** 공유 refresh: 구독자에게 브로드캐스트 */
async function refresh(force = false) {
  // force=false 이고 너무 촘촘하면 스킵
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

  // 정리 함수 – 개발 HMR 대비
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
    // 초기값: 캐시 → 모듈 공유값
    const cached = Number(localStorage.getItem("__cartLineCount__"));
    return Number.isFinite(cached) ? cached : currentCount;
  });

  useEffect(() => {
    ensureGlobalListeners();

    // 구독 시작
    subscribers.add(setCount);

    // 첫 렌더에서 실제값으로 동기화(중복 요청은 자동 합쳐짐)
    refresh(true);

    return () => {
      subscribers.delete(setCount);
      if (subscribers.size === 0 && window.__CART_COUNT_CLEANUP__) {
        // 필요 시 전역 리스너 정리 (선택)
        // window.__CART_COUNT_CLEANUP__();
      }
    };
  }, []);

  return count;
}

/** 외부(장바구니 추가/삭제 등)에서 호출해 갱신하고 싶으면 이 함수 임포트해서 호출 */
export async function syncCartBadge() {
  return refresh(true);
}