import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import useUser from "../../hooks/useUser";
import useCartCount from "../../hooks/useCartCount";
import "./Header.css";

export default function Header({ user, onLogout }) {
  const location = useLocation();
  const HIDE_PATHS = ["/login", "/signup"];
  const shouldHide = HIDE_PATHS.some((p) => location.pathname.startsWith(p));

  const isLoggedIn = !!user?.name;
  const isAdmin = user?.role === "ADMIN";
  const { needsSetup } = useUser();
  const cartCount = useCartCount({ enabled: !!localStorage.getItem("accessToken") });

  const [categories, setCategories] = useState([]);
  const [boardTypes, setBoardTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");

  useEffect(() => {
    fetch("/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch((e) => console.error("카테고리 불러오기 실패", e));
  }, []);

  const loadBoardTypes = () =>
    fetch("/board-types")
      .then((r) => r.json())
      .then(setBoardTypes)
      .catch((e) => console.error("게시판 타입 불러오기 실패", e));

  useEffect(() => {
    loadBoardTypes();
  }, []);

  const isActiveType = (id) => {
    if (location.pathname !== "/board") return false;
    const sp = new URLSearchParams(location.search);
    return sp.get("typeId") === String(id);
  };

  const authHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  };

  const startEdit = (bt) => {
    setEditingId(bt.boardTypeId);
    setEditName(bt.boardTypeName ?? bt.name ?? "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return alert("이름을 입력해주세요.");
    try {
      const res = await fetch(`/admin/board-types/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error("수정 실패");
      await loadBoardTypes();
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert("수정에 실패했습니다.");
    }
  };

  const deleteType = async (id) => {
    if (!window.confirm("정말 삭제할까요?")) return;
    try {
      const res = await fetch(`/admin/board-types/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("삭제 실패");
      await loadBoardTypes();
      if (editingId === id) cancelEdit();
    } catch (e) {
      console.error(e);
      window.alert("삭제에 실패했습니다.");
    }
  };

  const addType = async () => {
    if (!addName.trim()) return alert("이름을 입력해주세요.");
    try {
      const res = await fetch(`/admin/board-types`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: addName.trim() }),
      });
      if (!res.ok) throw new Error("추가 실패");
      await loadBoardTypes();
      setAdding(false);
      setAddName("");
    } catch (e) {
      console.error(e);
      alert("추가에 실패했습니다.");
    }
  };

  if (shouldHide) return null;

  return (
    <header className="header">
      {/* 상단바 */}
      <div className="top-bar">
        <div className="spacer" />
        <div className="auth-buttons">
          <Link className="link-btn cart-btn" to="/cart" title="장바구니">
            <span className="cart-emoji" role="img" aria-label="cart">🛒</span>
            <span className="cart-text">장바구니</span>
            {cartCount > 0 && <span className="cart-badge" aria-label="count">{cartCount}</span>}
          </Link>

          {isLoggedIn ? (
            <>
              <span className="hello">
                <strong>{user.name}</strong>
                {isAdmin && <span className="badge">관리자</span>} 님
              </span>
              <Link className="link-btn" to={needsSetup ? "/profile-setup" : "/me"}>
                {needsSetup ? "프로필 설정" : "마이페이지"}
              </Link>
              <button className="link-btn" onClick={onLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link className="link-btn" to="/login">로그인</Link>
              <Link className="link-btn" to="/signup">회원가입</Link>
            </>
          )}
        </div>
      </div>

      {/* 로고 */}
      <div className="logo">
        <h1><Link to="/">WIThSHOP</Link></h1>
      </div>

      {/* 네비 */}
      <nav className="nav-bar">
        <div className="nav-scroll">
          <ul className="nav-list">
            {categories.map((c) => (
              <li key={c.categoryId}>
                <NavLink
                  to={`/category/${c.categoryId}`}
                  state={{ categoryName: c.categoryName }}
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  {c.categoryName}
                </NavLink>
              </li>
            ))}

            <li className="dropdown">
              <NavLink to="/board" className={({ isActive }) => (isActive ? "active-link" : "")}>
                COMMUNITY
              </NavLink>

              <ul className="submenu">
                {boardTypes.map((bt) => {
                  const id = bt.boardTypeId;
                  const name = bt.boardTypeName ?? bt.name;
                  const active = isActiveType(id);

                  return (
                    <li key={id} className="submenu-row">
                      {editingId === id ? (
                        <div className="inline-edit">
                          <input
                            className="inline-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                          />
                          <button className="btn-xs primary" onClick={() => saveEdit(id)}>저장</button>
                          <button className="btn-xs" onClick={cancelEdit}>취소</button>
                          <button className="btn-xs danger" onClick={() => deleteType(id)}>삭제</button>
                        </div>
                      ) : (
                        <div className="submenu-item">
                          <Link to={`/board?typeId=${id}`} className={active ? "active-link" : ""}>
                            {name}
                          </Link>
                          {isAdmin && (
                            <button className="icon-btn" title="편집" onClick={() => startEdit(bt)}>
                              ✏️
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}

                {isAdmin && (
                  <li className="submenu-row add-row">
                    {adding ? (
                      <div className="inline-edit">
                        <input
                          className="inline-input"
                          placeholder="새 게시판 이름"
                          value={addName}
                          onChange={(e) => setAddName(e.target.value)}
                          autoFocus
                        />
                        <button className="btn-xs primary" onClick={addType}>추가</button>
                        <button className="btn-xs" onClick={() => { setAdding(false); setAddName(""); }}>취소</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => setAdding(true)}>+ 타입 추가</button>
                    )}
                  </li>
                )}
              </ul>
            </li>

            {isAdmin && (
              <li>
                <NavLink to="/upload" className={({ isActive }) => (isActive ? "active-link" : "")}>
                  제품등록
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}