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
    {
      src: "https://withshop.s3.ap-northeast-2.amazonaws.com/r1.png",
      link: "https://www.instagram.com/reel/C1JiV9ZP1mN/",
    },
    {
      src: "https://withshop.s3.ap-northeast-2.amazonaws.com/r2.png",
      link: "https://www.instagram.com/reel/C1381WNv7z9/",
    },
    {
      src: "https://withshop.s3.ap-northeast-2.amazonaws.com/r3.png",
      link: null,
    },
  ];

  return (
    <section className="main-carousel">
      <Slider {...settings}>
        {images.map((item, idx) => (
          <div key={idx} className="banner-frame">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                <img
                  className="banner-img"
                  src={item.src}
                  alt={`슬라이드 ${idx + 1}`}
                />
              </a>
            ) : (
              <img
                className="banner-img"
                src={item.src}
                alt={`슬라이드 ${idx + 1}`}
              />
            )}
          </div>
        ))}
      </Slider>
    </section>
  );
}