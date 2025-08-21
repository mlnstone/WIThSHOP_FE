// src/hooks/useCartCount.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMyCart } from "../services/cart";

export default function useCartCount({ enabled = true, refetchOnFocus = true } = {}) {
  const [count, setCount] = useState(0);

  const bc = useMemo(() => {
    try {
      return new BroadcastChannel("cart");
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const { ok, data } = await fetchMyCart();
    if (ok && data?.items) {
      const c =  data.items.length;
      setCount(c);

      try { localStorage.setItem("__cartCount__", String(c)); } catch {}
      try { bc && bc.postMessage({ type: "set", count: c }); } catch {}
    }
  }, [enabled, bc]);

  useEffect(() => {
    if (!enabled) return;

    refresh();

    const onSet = (e) => {
      const v = e?.detail;
      if (typeof v === "number") setCount(v);
    };
    const onBump = (e) => {
      const v = e?.detail;
      if (typeof v === "number") setCount(v);
      else setCount((x) => x + 1);
    };
    window.addEventListener("cart:set", onSet);
    window.addEventListener("cart:bump", onBump);

    const onMsg = (e) => {
      const { type, count } = e.data || {};
      if (type === "set" && typeof count === "number") setCount(count);
      if (type === "bump") setCount((x) => x + 1);
    };
    bc && bc.addEventListener("message", onMsg);

    const onStorage = (ev) => {
      if (ev.key === "__cartCount__" && ev.newValue != null) {
        const n = Number(ev.newValue);
        if (!Number.isNaN(n)) setCount(n);
      }
    };
    window.addEventListener("storage", onStorage);

    const onFocus = () => refetchOnFocus && refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("cart:set", onSet);
      window.removeEventListener("cart:bump", onBump);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      bc && bc.removeEventListener("message", onMsg);
      bc && bc.close();
    };
  }, [enabled, refetchOnFocus, bc, refresh]);

  return count;
}