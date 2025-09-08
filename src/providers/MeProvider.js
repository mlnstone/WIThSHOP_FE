// src/providers/MeProvider.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const MeCtx = createContext(null);

export function MeProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false); // 중복 호출 방지

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();

    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const r = await fetch("/api/me", {
          headers,
          cache: "no-store",
          signal: controller.signal,
        });

        if (r.ok) {
          const data = await r.json().catch(() => null);
          if (data) setMe(data);
        }
      } catch {
        // 네트워크 에러 → 무시 (me=null 유지)
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <MeCtx.Provider value={{ me, loading, setMe }}>
      {children}
    </MeCtx.Provider>
  );
}

export function useMe() {
  return useContext(MeCtx);
}