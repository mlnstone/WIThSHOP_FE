import React from "react";
import { Container, Row, Col, Card, Button, Stack, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import MainCarousel from "../components/MainCarousel";
import { BACKEND } from "../services/api";

export default function Home({ user, onLogout }) {
  const isLoggedIn = Boolean(user?.name);

  return (
    <>
      <div className="container-fluid p-0" style={{ marginBottom: "2rem" }}>
        <MainCarousel />
      </div>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={7} lg={6}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <Card.Title className="mb-2">메인</Card.Title>
                <Card.Subtitle className="text-muted mb-4">오픈마켓 쇼핑몰</Card.Subtitle>

                {isLoggedIn ? (
                  <>
                    <div className="mb-3">
                      <strong>안녕하세요, {user.name}님</strong>{" "}
                      {user.role === "ADMIN" && <Badge bg="secondary">관리자</Badge>}
                    </div>
                    <Button variant="outline-danger" onClick={onLogout}>로그아웃</Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 text-muted">로그인이 필요합니다.</div>
                    <Stack gap={2}>
                      <Button variant="dark" size="lg" as="a" href={`${BACKEND}/oauth2/authorization/google`}>
                        Google 로그인
                      </Button>
                      <Button as={Link} to="/signup" variant="outline-primary">회원가입</Button>
                      <Button as={Link} to="/login" variant="outline-secondary">아이디/비번 로그인</Button>
                    </Stack>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}