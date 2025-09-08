// src/providers/MeProvider.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { apiFetch, authHeaders } from "../services/api";

const MeCtx = createContext(null);

export function MeProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false); // 중복 호출 방지

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        const { ok, data } = await apiFetch("/api/me", {
          headers: authHeaders(),
          cache: "no-store",
        });
        if (ok && data) setMe(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return <MeCtx.Provider value={{ me, loading, setMe }}>{children}</MeCtx.Provider>;
}

export function useMe() {
  return useContext(MeCtx);
}