// src/components/map/KakaoMap.js
import React, { useEffect, useRef, useState } from "react";
import useKakaoLoader from "../../hooks/useKakaoLoader";

export default function KakaoMap({
  open = true,
  hq = { lat: 37.5665, lng: 126.9780 }, // 기본: 서울시청
  defaultLevel = 6,
  style = { width: "100%", height: 520, borderRadius: 12 },
}) {
  const loaded = useKakaoLoader();
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const [myPos, setMyPos] = useState(null);

  // 지도 초기화 (HQ = 빨간 마커)
  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    const { kakao } = window;

    const center = new kakao.maps.LatLng(hq.lat, hq.lng);
    const map = new kakao.maps.Map(containerRef.current, {
      center,
      level: defaultLevel,
    });
    mapRef.current = map;

    // 🔴 근무지 마커 (빨간색)
    const redMarkerImage = new kakao.maps.MarkerImage(
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
      new kakao.maps.Size(40, 42),
      { offset: new kakao.maps.Point(20, 42) }
    );

    new kakao.maps.Marker({
      map,
      position: center,
      title: "근무지(서울역)",
      image: redMarkerImage,
    });

    // 모달 안에서 지도 뜰 때 타일 강제 재계산
    setTimeout(() => {
      map.relayout();
      map.setCenter(center);
    }, 0);

    // 내 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("위치 정보를 가져올 수 없습니다:", err?.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      mapRef.current = null;
    };
  }, [loaded, hq.lat, hq.lng, defaultLevel]);

  // 내 위치 마커 (파란색)
  useEffect(() => {
    if (!mapRef.current || !myPos) return;
    const { kakao } = window;
    const map = mapRef.current;

    const pos = new kakao.maps.LatLng(myPos.lat, myPos.lng);
    const meMarker = new kakao.maps.Marker({
      map,
      position: pos,
      title: "내 위치",
    });

    // 지도에 두 점 모두 보이도록 bounds 조정
    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(new kakao.maps.LatLng(hq.lat, hq.lng));
    bounds.extend(pos);
    map.setBounds(bounds, 50, 50, 50, 50);

    return () => {
      meMarker.setMap(null);
    };
  }, [myPos, hq]);

  // 모달 열릴 때마다 보정
  useEffect(() => {
    if (!open || !loaded || !mapRef.current) return;
    const { kakao } = window;
    const center = new kakao.maps.LatLng(hq.lat, hq.lng);
    mapRef.current.relayout();
    mapRef.current.setCenter(center);
  }, [open, loaded, hq.lat, hq.lng]);

  return <div ref={containerRef} style={style} />;
}