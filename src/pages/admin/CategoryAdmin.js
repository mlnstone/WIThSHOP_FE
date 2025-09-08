// src/components/admin/CategoryAdmin.js
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form } from "react-bootstrap";
import { apiFetch, authHeaders } from "../../services/api";

export default function CategoryAdmin() {
  const [categories, setCategories] = useState([]);
  const [show, setShow] = useState(false);
  const [editedItem, setEditedItem] = useState({ categoryName: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories();
  }, []);

  const getCategories = async () => {
    const { ok, data } = await apiFetch("/admin/categories", {
      headers: { ...authHeaders() },
    });
    if (ok && Array.isArray(data)) setCategories(data);
  };

  const handleShow = (item) => {
    setEditedItem(item ? { ...item } : { categoryName: "" });
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setEditedItem({ categoryName: "" });
  };

  const saveCategory = async () => {
    if (!editedItem.categoryName?.trim()) {
      alert("카테고리명을 입력하세요.");
      return;
    }
    setSaving(true);
    const body = JSON.stringify({ categoryName: editedItem.categoryName.trim() });

    const req =
      editedItem.categoryId
        ? apiFetch(`/admin/categories/${editedItem.categoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body,
          })
        : apiFetch("/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body,
          });

    const { ok, data } = await req;
    setSaving(false);

    if (!ok) {
      alert(data?.message || "저장 실패");
      return;
    }
    handleClose();
    getCategories();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const { ok, data } = await apiFetch(`/admin/categories/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    if (!ok) {
      alert(data?.message || "삭제 실패");
      return;
    }
    getCategories();
  };

  return (
    <div className="p-4">
      <h3>카테고리 관리</h3>
      <Button className="mb-3" onClick={() => handleShow()}>카테고리 추가</Button>

      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>카테고리명</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.categoryId}>
              <td>{cat.categoryId}</td>
              <td>{cat.categoryName}</td>
              <td>
                <Button variant="warning" size="sm" onClick={() => handleShow(cat)}>수정</Button>{" "}
                <Button variant="danger" size="sm" onClick={() => deleteCategory(cat.categoryId)}>삭제</Button>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-muted">카테고리가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* 카테고리 추가/수정 모달 */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editedItem.categoryId ? "카테고리 수정" : "카테고리 추가"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>카테고리명</Form.Label>
            <Form.Control
              type="text"
              value={editedItem.categoryName}
              onChange={(e) => setEditedItem({ ...editedItem, categoryName: e.target.value })}
              placeholder="예) 아우터"
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>취소</Button>
          <Button variant="primary" onClick={saveCategory} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}