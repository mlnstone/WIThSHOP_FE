// src/services/auth.js
export function signOut(redirectTo = "/login") {
    // 토큰 및 캐시 제거
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("displayName");

    // 장바구니 캐시도 정리
    localStorage.removeItem("__cartCount__");
    localStorage.removeItem("__cartLineCount__");

    const stamp = String(Date.now());
    localStorage.setItem("auth:changed", stamp);
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { stamp } }));

    window.location.replace(redirectTo);
}