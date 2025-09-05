// src/components/layout/Footer.js
import React from "react";

export default function Footer() {
    return (
        <footer className="bg-light text-center text-lg-start mt-auto">
            <div className="container py-5">
                {/* 메인 문구 */}
                <h6 className="fw-bold mb-2" style={{ fontFamily: "inherit" }}>
                    WIThSHOP은 믿고 맡길 수 있는 쇼핑몰입니다.
                </h6>
                <h6 className="fw-bold mb-2" style={{ fontFamily: "inherit" }}>
                    즐거운 쇼핑을 경험하세요.
                </h6>

                {/* SNS 아이콘 */}
                <div className="mb-4">
                    <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-dark me-3 fs-4"
                    >
                        <i className="bi bi-facebook"></i>
                    </a>
                    <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-dark me-3 fs-4"
                    >
                        <i className="bi bi-instagram"></i>
                    </a>
                    <a
                        href="https://github.com/mlnstone"
                        target="_blank"
                        rel="noreferrer"
                        className="text-dark fs-4"
                    >
                        <i className="bi bi-github"></i>
                    </a>
                </div>

                {/* 구분선 */}
                <hr className="my-3" />

                {/* 연락처/주소 */}
                <div className="text-muted small" style={{ fontFamily: "inherit" }}>
                    <div>
                        email :{" "}
                        <a href="mailto:dnswjs1776@naver.com" className="text-reset">
                            dnswjs1776@naver.com
                        </a>
                    </div>
                    <div>address : 인천 부평구</div>
                </div>
            </div>
        </footer>
    );
}