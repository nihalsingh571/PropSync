import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section">
            <div className="footer-brand">
              <span className="logo-icon">🏠</span>
              <span className="brand-name">NeighborFit</span>
            </div>
            <p>
              Find your perfect neighborhood match through our intelligent 
              lifestyle-based matching algorithm. Make informed decisions 
              about where to live.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                📘
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                🐦
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                📷
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                💼
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/neighborhoods">Explore Neighborhoods</Link></li>
              <li><Link to="/register">Get Started</Link></li>
              <li><Link to="/login">Sign In</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div className="footer-section">
            <h3>Features</h3>
            <ul className="footer-links">
              <li><a href="#smart-matching">Smart Matching</a></li>
              <li><a href="#data-insights">Data Insights</a></li>
              <li><a href="#community-reviews">Community Reviews</a></li>
              <li><a href="#budget-planning">Budget Planning</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h3>Support</h3>
            <ul className="footer-links">
              <li><a href="#help">Help Center</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#feedback">Feedback</a></li>
            </ul>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span>support@neighborfit.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="footer-section">
            <h3>Stay Updated</h3>
            <p>Get the latest neighborhood insights and updates.</p>
            <div className="newsletter">
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="newsletter-btn">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} NeighborFit. All rights reserved.</p>
          <ul className="footer-bottom-links">
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#cookies">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;