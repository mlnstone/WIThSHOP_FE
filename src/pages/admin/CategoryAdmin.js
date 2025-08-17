import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form } from "react-bootstrap";

const BACKEND = "http://localhost:8887"; // API 주소

export default function CategoryAdmin() {
  const [categories, setCategories] = useState([]);
  const [show, setShow] = useState(false);
  const [editedItem, setEditedItem] = useState({ categoryName: "" });

  useEffect(() => {
    getCategories();
  }, []);

  const getCategories = async () => {
    const res = await fetch(`${BACKEND}/admin/categories`);
    const data = await res.json();
    setCategories(data);
  };

  const handleShow = (item) => {
    setEditedItem(item || { categoryName: "" });
    setShow(true);
  };

  const handleClose = () => setShow(false);

  const saveCategory = async () => {
    if (editedItem.categoryId) {
      await fetch(`${BACKEND}/admin/categories/${editedItem.categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName: editedItem.categoryName }),
      });
    } else {
      await fetch(`${BACKEND}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName: editedItem.categoryName }),
      });
    }
    handleClose();
    getCategories();
  };

  const deleteCategory = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await fetch(`${BACKEND}/admin/categories/${id}`, { method: "DELETE" });
      getCategories();
    }
  };

  return (
    <div className="p-4">
      <h3>카테고리 관리</h3>
      <Button className="mb-3" onClick={() => handleShow()}>카테고리 추가</Button>
      <Table bordered hover>
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
        </tbody>
      </Table>

      {/* 카테고리 추가/수정 모달 */}
      <Modal show={show} onHide={handleClose}>
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
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>취소</Button>
          <Button variant="primary" onClick={saveCategory}>저장</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}