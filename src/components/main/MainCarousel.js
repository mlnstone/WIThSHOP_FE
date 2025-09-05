// src/components/main/MainCarousel.js
import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./MainCarousel.css";

export default function MainCarousel() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    accessibility: false,
  };

  const images = ["/images/banner1.jpg", "/images/banner2.jpg", "/images/banner3.jpg"];

  return (
    // 화면 전체폭으로 빼기
    <section className="main-carousel">
      <Slider {...settings}>
        {images.map((src, idx) => (
          <div key={idx} className="banner-frame">
            <img className="banner-img" src={src} alt={`슬라이드 ${idx + 1}`} />
          </div>
        ))}
      </Slider>
    </section>
  );
}