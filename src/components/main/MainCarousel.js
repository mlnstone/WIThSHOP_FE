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

  const images = [
    "https://i.namu.wiki/i/r8272oYH3BGODl2Tc2pw80HakUDSHwCBzG7yQiKZuGq06CFw4NASVgXn7QWOIZQGigvFsR_wNLguNK0efreU9-q1rEVzahLfPbwGkDLFQ8MomuCG3qyUTGY0mflRg3nEmm4ZAT44TVMzLufxTrRYbw.webp",
    "https://i.namu.wiki/i/7qOBsy38ICHZTDQM2htYTwRKIRcNJjUoXTHEQPSTjcHSM6q-9wjtjZ-6nNeRgapmZdkFGwkp6XMm4DdTuZS3Qt7OtJxNMWwegYo0OK5x6LNe5DrUDyLZCiLDpZ4sr-ydy__Gg0I_HIexZH8PwjFKYw.webp",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREBqw6THa8LdmE6UqC92pyYfYyaBxXENxjGg&s"
  ];

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