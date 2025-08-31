// src/pages/Home.js
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import MainCarousel from "../components/main/MainCarousel";
import HomeWelcomeCard from "../components/main/HomeWelcomeCard";

export default function Home({ user, onLogout }) {
  console.log("✅ Home props:", { user, onLogout });
  console.log('REACT_APP_BACKEND', process.env.REACT_APP_BACKEND);
  return (
    <>
      <div className="container-fluid p-0" style={{ marginBottom: "2rem" }}>
        <MainCarousel />
      </div>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={7} lg={6}>
            <HomeWelcomeCard user={user} onLogout={onLogout} />
          </Col>
        </Row>
      </Container>
    </>
  );
}