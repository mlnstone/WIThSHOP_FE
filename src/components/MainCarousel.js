import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./MainCarousel.css";   // 👈 이 줄 추가
// 홈 배너 설정
export default function MainCarousel() {
  const settings = {
    dots: true,            // 하단 점 네비게이션
    infinite: true,        // 무한 반복
    speed: 1000,            // 전환 속도
    slidesToShow: 1,       // 한 번에 보여줄 개수
    slidesToScroll: 1,     // 한 번에 넘길 개수
    autoplay: true,        // 자동 재생
    autoplaySpeed: 7000,   // 자동 전환 시간
    arrows: true,          // 좌우 화살표 표시
    accessibility: false, 

  };

  const images = ["/images/banner1.jpg", "/images/banner2.jpg", "/images/banner3.jpg"];

  return (
    <div className="main-carousel">
      <Slider {...settings}>
        {images.map((src, idx) => (
          <div key={idx}>
            <img className="banner-img" src={src} alt={`슬라이드 ${idx + 1}`} />
          </div>
        ))}
      </Slider>
    </div>
  );
}