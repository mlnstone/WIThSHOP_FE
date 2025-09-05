// src/components/me/Sidebar.js
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="my-sidebar card">
      <nav className="list-group list-group-flush">
        <NavLink end to="/me" className="list-group-item my-link">마이페이지</NavLink>
        <NavLink to="/me/orders" className="list-group-item my-link">주문 내역</NavLink>
        <NavLink to="/me/reviews" className="list-group-item my-link">내 리뷰</NavLink>
      </nav>
    </aside>
  );
}