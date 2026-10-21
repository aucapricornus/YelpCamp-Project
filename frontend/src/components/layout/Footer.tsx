import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaGithub, FaTwitter, FaInstagram, FaTree } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="mt-auto py-5"
      style={{
        backgroundColor: "var(--camp-card-bg)", // Adapts to Day/Night theme
        borderTop: "1px solid var(--camp-border)",
        transition: "background-color 0.3s",
      }}
    >
      <Container>
        <Row className="gy-4">
          {/* COLUMN 1: Brand & Slogan */}
          <Col lg={4} md={6}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-3">⛺</span>
              <span
                className="fs-4 fw-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--camp-primary)",
                }}
              >
                YelpCamp
              </span>
            </div>
            <p className="text-muted">
              Discover the best camping grounds from around the world. Share
              your adventures and find your next escape into nature.
            </p>
          </Col>

          {/* COLUMN 2: Quick Links */}
          <Col lg={2} md={6} xs={6}>
            <h5
              className="fw-bold mb-3"
              style={{ color: "var(--bs-body-color)" }}
            >
              Discover
            </h5>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li>
                <Link
                  to="/"
                  className="text-decoration-none text-muted hover-link"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/campgrounds"
                  className="text-decoration-none text-muted hover-link"
                >
                  Campgrounds
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-decoration-none text-muted hover-link"
                >
                  Join Us
                </Link>
              </li>
            </ul>
          </Col>

          {/* COLUMN 3: Legal / Info */}
          <Col lg={2} md={6} xs={6}>
            <h5
              className="fw-bold mb-3"
              style={{ color: "var(--bs-body-color)" }}
            >
              Company
            </h5>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li>
                <Link
                  to="#"
                  className="text-decoration-none text-muted hover-link"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-decoration-none text-muted hover-link"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="text-decoration-none text-muted hover-link"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </Col>

          {/* COLUMN 4: Socials */}
          <Col lg={4} md={6}>
            <h5
              className="fw-bold mb-3"
              style={{ color: "var(--bs-body-color)" }}
            >
              Follow Us
            </h5>
            <div className="d-flex gap-3">
              <a
                target="blank"
                href="https://github.com/aucapricornus"
                className="text-muted fs-4 social-icon"
              >
                <FaGithub />
              </a>
              <a
                target="blank"
                href="https://github.com/aucapricornus"
                className="text-muted fs-4 social-icon"
              >
                <FaTwitter />
              </a>
              <a
                target="blank"
                href="https://github.com/aucapricornus"
                className="text-muted fs-4 social-icon"
              >
                <FaInstagram />
              </a>
            </div>
            <div
              className="mt-4 p-3 rounded"
              style={{ backgroundColor: "var(--camp-input-bg)" }}
            >
              <div className="d-flex align-items-center gap-2 text-muted small">
                <FaTree className="text-success" />
                <span>Made with love by a camper, for campers.</span>
              </div>
            </div>
          </Col>
        </Row>

        <hr className="my-4" style={{ borderColor: "var(--camp-border)" }} />

        <div className="text-center text-muted small">
          &copy; {currentYear} YelpCamp. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
