// src/pages/order/MyOrdersPage.js
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../services/api";
import { Link, useSearchParams } from "react-router-dom";
import MySidebar from "../../components/me/Sidebar";
import Pagination from "../../components/common/Pagination";

export default function MyOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 쿼리 파라미터
  const page = useMemo(() => Number(searchParams.get("page") || 0), [searchParams]);
  const sort = (searchParams.get("sort") || "desc").toLowerCase(); // desc|asc
  const size = 10;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }

    setLoading(true);
    setError("");

    const controller = new AbortController();
    const qs = new URLSearchParams({
      page,
      size,
      sort: `orderCreatedAt,${sort}`, // 서버 정렬
    });

    (async () => {
      try {
        const res = await apiFetch(`/orders?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = res?.data ?? res;
        setPageData(data);
      } catch (e) {
        console.error(e);
        setError("주문 내역을 불러오지 못했습니다.");
        setPageData(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [page, sort]);

  const setParams = (overrides) => {
    setSearchParams({
      page: String(overrides.page ?? page),
      sort: overrides.sort ?? sort,
    });
  };

  const titleForOrder = (o) => {
    const list = Array.isArray(o.items) ? o.items : [];
    const count = list.length;
    if (count <= 0) return o.orderCode || "주문";
  
    const first = list[0];
    const firstName = first?.menuName || "상품";
    if (count === 1) {
      const q = first?.quantity ?? 1;
      return `${firstName} x ${q}`;
    }
    return `${firstName} 외 ${count - 1}건`;
  };
  const goPage = (p) => setParams({ page: p });
  const setSortOrder = (order) => setParams({ page: 0, sort: order });

  if (loading) return <div className="container py-4">불러오는 중...</div>;
  if (error) return <div className="container py-4">{error}</div>;
  if (!pageData) return <div className="container py-4">목록을 불러오지 못했습니다.</div>;

  const {
    content = [],
    number = 0,
    totalPages = 1,
  } = pageData;

  // 번호, 날짜/상태 포맷
  const rowNoBase = number * size; // 0, 10, 20…
  const fmt = (dt) => (dt ? dt.replace("T", " ").slice(0, 16) : "-");
  const fmtStatus = (s) =>
    ({ REQUESTED: "주문요청", APPROVED: "결제완료", SHIPPED: "배송중", DELIVERED: "배송완료", CANCELED: "취소", REJECTED: "거절" }[s] || s);

  const thumbUrl = () =>
    "https://i.namu.wiki/i/yQIov3mLlQhfZVIggMUJpSiGu4GtqFzWOpR6uFC3rqnYf1L05tU6YWOAhTotIKi1mupaMzQJxBmf8J3ykHNcIWTBenbNZB8tkT0fI8H05QmECsu2LAxiFXz6ku5q_WSywQeXLOmsoDuEi38bQxoVHQ.webp";
  // 썸네일(첫 상품) – 프로젝트 API에 맞게 경로만 조정하면 됨
  // const thumbUrl = (o) => {
  //   const first = o.items?.[0];
  //   if (!first) return "/noimage.png";
  //   // 1) 응답에 imageUrl이 있으면 그걸 사용
  //   if (first.imageUrl) return first.imageUrl;
  //   // 2) 없으면 menuId로 유추한 썸네일 엔드포인트(프로젝트에 맞게 바꿔줘)
  //   if (first.menuId) return `/menus/${first.menuId}/thumbnail`;
  //   return "/noimage.png";
  // };


  return (
    <div className="container py-4">
      <div className="row g-3">
        {/* 사이드바 폭 ↓ 2, 본문 폭 ↑ 10 */}
        <div className="col-12 col-md-2">
          <MySidebar />
        </div>

        <div className="col-12 col-md-10">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="m-0">주문 내역</h3>
            <div className="d-flex gap-2">
              <button
                className={`btn btn-sm rounded-pill px-3 ${sort === "desc" ? "btn-dark" : "btn-outline-dark"
                  }`}
                onClick={() => setSortOrder("desc")}
              >
                최신순
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 ${sort === "asc" ? "btn-dark" : "btn-outline-dark"
                  }`}
                onClick={() => setSortOrder("asc")}
              >
                오래된순
              </button>
            </div>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 70, textAlign: "center" }}>#</th> {/* 순서 */}
                    <th style={{ width: 72 }}>이미지</th>                 {/* 썸네일 */}
                    <th style={{ width: 260 }}>주문상품</th>
                    <th style={{ width: 140 }}>금액</th>
                    <th style={{ width: 120 }}>상태</th>
                    <th style={{ width: 200 }}>주문일시</th>
                  </tr>
                </thead>
                <tbody>
                  {content.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4">주문 내역이 없습니다.</td>
                    </tr>
                  )}
                  {content.map((o, idx) => (
                    <tr key={o.orderCode || o.orderId}>
                      {/* 번호: 1~10, 다음 페이지 11~20 … */}
                      <td style={{ textAlign: "center" }}>{rowNoBase + idx + 1}</td>

                      {/* 이미지 */}

                      <td>
                        <Link to={`/orders/code/${o.orderCode}`} style={{ display: "inline-block" }}>
                          <img
                            src={thumbUrl()}
                            alt="상품이미지"
                            style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, cursor: "pointer" }}
                            onError={(e) => (e.currentTarget.src = "/noimage.png")}
                          />
                        </Link>
                      </td>

                      {/* 주문코드(상세링크) */}
                      <td>
                        <Link to={`/orders/code/${o.orderCode}`}>
                             {titleForOrder(o)}
                        </Link>
                      </td>

                      <td>{(o.orderPrice ?? 0).toLocaleString()}원</td>
                      <td>{fmtStatus(o.orderStatus)}</td>
                      <td>{fmt(o.orderCreatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          <Pagination
            page={number}
            totalPages={totalPages}
            blockSize={5}
            onChange={goPage}
            variant="dark"   // 원하는 톤: 'dark' | 'primary' | 'gray'
            size="sm"
            className="mt-4"
          />
        </div>
      </div>
    </div>
  );
}