import { useEffect, useState } from "react";

export default function useKakaoLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const appKey =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_KAKAO_MAP_KEY) ||
      process.env.REACT_APP_KAKAO_MAP_KEY;

    if (!appKey) {
      console.error("Kakao App Key is missing (VITE_KAKAO_MAP_KEY or REACT_APP_KAKAO_MAP_KEY)");
      return;
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => setLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => setLoaded(true));
    script.onerror = () => console.error("Failed to load Kakao Maps SDK");
    document.head.appendChild(script);
  }, []);

  return loaded;
}