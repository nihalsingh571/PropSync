import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="ps-footer">
      <div className="ps-footer__inner">

        {/* ── Top grid ─────────────────────────────────────────── */}
        <div className="ps-footer__grid">

          {/* Brand */}
          <div className="ps-footer__brand">
            <div className="ps-footer__logo">
              <span>🏢</span>
              <span className="ps-footer__logo-name">PropSync</span>
            </div>
            <p className="ps-footer__tagline">
              A full-stack property management platform for rental properties,
              tenant lifecycle, maintenance workflows, and shared amenity
              booking — all in one place.
            </p>
            <div className="ps-footer__chips">
              <span className="ps-chip">MERN Stack</span>
              <span className="ps-chip">TypeScript</span>
              <span className="ps-chip">Socket.IO</span>
              <span className="ps-chip">MongoDB Atlas</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="ps-footer__col">
            <h4 className="ps-footer__col-title">Navigation</h4>
            <ul className="ps-footer__list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/properties">Properties</Link></li>
              <li><Link to="/maintenance">Maintenance</Link></li>
              <li><Link to="/amenities">Amenities</Link></li>
              <li><Link to="/notifications">Notifications</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div className="ps-footer__col">
            <h4 className="ps-footer__col-title">Features</h4>
            <ul className="ps-footer__list">
              <li><span>🔐 Role-Based Access Control</span></li>
              <li><span>🏠 Property & Tenant Management</span></li>
              <li><span>🔧 Maintenance State Machine</span></li>
              <li><span>🏊 Amenity Booking System</span></li>
              <li><span>🔔 Real-Time Notifications</span></li>
              <li><span>📊 Admin Analytics Dashboard</span></li>
            </ul>
          </div>

          {/* Developer */}
          <div className="ps-footer__col">
            <h4 className="ps-footer__col-title">Developer</h4>
            <div className="ps-footer__dev">
              <div className="ps-footer__dev-avatar">NK</div>
              <div>
                <div className="ps-footer__dev-name">Nihal Kumar Singh</div>
                <div className="ps-footer__dev-role">Full-Stack Developer</div>
              </div>
            </div>
            <div className="ps-footer__dev-links">
              <a
                href="https://github.com/nihalsingh571"
                target="_blank"
                rel="noopener noreferrer"
                className="ps-footer__dev-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                github.com/nihalsingh571
              </a>
              <a
                href="https://github.com/nihalsingh571/PropSync"
                target="_blank"
                rel="noopener noreferrer"
                className="ps-footer__dev-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                PropSync Repository
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────── */}
        <div className="ps-footer__bottom">
          <span>© {currentYear} PropSync — Built by Nihal Kumar Singh</span>
          <span className="ps-footer__bottom-stack">
            React · Node.js · MongoDB · TypeScript
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;