import React from "react";
import "./notFound.css";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="nf-page">
      <nav className="nf-navbar">
        <div className="nf-logo">
          <div className="nf-logo-icon">✏️</div>
          <span>Mente Colectiva</span>
        </div>

        <ul className="nf-nav-links">
          <li><a href="#">Features</a></li>
          <li><a href="#">Benefits</a></li>
          <li><a href="#">Team</a></li>
        </ul>

        <div className="nf-nav-right">
          <p>Username: Hvhjb</p>
          <Link to="/history">History</Link>
          <span>↗</span>
        </div>
      </nav>

      <div className="nf-container">
        <div className="nf-badge">&gt; Oops! Lost in cyberspace</div>

        <div className="nf-error-code">404</div>

        <h1 className="nf-title">
          Page Not <span className="nf-highlight">Found</span>
        </h1>

        <p className="nf-description">
          The page you're looking for seems to have vanished into the digital void.
          Let's get you back on track to collaborate and create amazing things.
        </p>

        <div className="nf-wave-container">
          <svg className="nf-wave" viewBox="0 0 1200 150" preserveAspectRatio="none">
            <path d="M0,75 Q300,25 600,75 T1200,75" />
          </svg>
          <svg className="nf-wave" viewBox="0 0 1200 150" preserveAspectRatio="none">
            <path d="M0,75 Q300,100 600,75 T1200,75" />
          </svg>
          <svg className="nf-wave" viewBox="0 0 1200 150" preserveAspectRatio="none">
            <path d="M0,75 Q300,50 600,75 T1200,75" />
          </svg>
        </div>

        <div className="nf-buttons">
          <Link to="/" className="nf-btn nf-btn-primary">
            Go Home <span>→</span>
          </Link>

          <a href="/contact" className="nf-btn nf-btn-secondary">
            Contact Support <span>✨</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
