// src/lib/syncCartBadge.js
export function syncCartBadge() {
  // 숫자 전달하지 말고, 재조회 트리거만 보냄
  try { window.dispatchEvent(new CustomEvent("cartLine:set")); } catch {}

  // (선택) 탭 간 통지
  try {
    const bc = new BroadcastChannel("cartLine");
    bc.postMessage({ type: "set" }); // 값 없음
    bc.close();
  } catch {}
}