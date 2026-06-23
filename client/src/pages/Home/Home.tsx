import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero__bg">
          <div className="hero-orb hero-orb--1"></div>
          <div className="hero-orb hero-orb--2"></div>
          <div className="hero-orb hero-orb--3"></div>
        </div>
        <div className="container home-hero__content">
          <div className="home-hero__badge">
            <span className="badge-dot"></span>
            Real-Time Property Management Platform
          </div>
          <h1 className="home-hero__title">
            Property Management,<br />
            <span className="gradient-text">Simplified & Synced</span>
          </h1>
          <p className="home-hero__subtitle">
            PropSync connects property owners, tenants, and maintenance staff in one 
            intelligent platform. Track requests, book amenities, and manage properties 
            — all in real-time.
          </p>
          <div className="home-hero__actions">
            <Link to="/register" className="btn btn-primary btn-large home-hero__cta">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Sign In
            </Link>
          </div>
          <div className="home-hero__stats">
            <div className="hero-stat">
              <span className="hero-stat__number">4</span>
              <span className="hero-stat__label">User Roles</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat__number">Real-Time</span>
              <span className="hero-stat__label">Status Updates</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat__number">100%</span>
              <span className="hero-stat__label">Web-Based</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ─────────────────────────────────────────────────────── */}
      <section className="home-features">
        <div className="container">
          <div className="section-header">
            <h2>Everything you need, in one place</h2>
            <p>A complete ecosystem for modern property management</p>
          </div>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className={`feature-card feature-card--${feature.color}`}>
                <div className="feature-card__icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles Section ────────────────────────────────────────────────────── */}
      <section className="home-roles">
        <div className="container">
          <div className="section-header">
            <h2>Built for every role</h2>
            <p>Each user gets a tailored experience designed for their workflow</p>
          </div>
          <div className="roles-grid">
            {roles.map((role, idx) => (
              <div key={idx} className="role-card">
                <div className="role-card__avatar">{role.icon}</div>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
                <ul className="role-card__perks">
                  {role.perks.map((perk, pidx) => (
                    <li key={pidx}>
                      <span className="perk-check">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────────── */}
      <section className="home-cta">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to sync your properties?</h2>
            <p>Join PropSync today and bring your entire property ecosystem online.</p>
            <div className="cta-card__actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Create your account →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: '🏢',
    title: 'Property Management',
    description: 'Manage multiple properties, units, and all associated information from a single dashboard.',
    color: 'indigo'
  },
  {
    icon: '🔧',
    title: 'Maintenance Requests',
    description: 'Tenants submit requests, staff gets assigned, and owners track progress — all in real-time.',
    color: 'violet'
  },
  {
    icon: '📅',
    title: 'Amenity Booking',
    description: 'Smart booking system with automatic conflict detection for gyms, pools, meeting rooms, and more.',
    color: 'emerald'
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    description: 'Real-time push notifications for every event — never miss a status update or booking confirmation.',
    color: 'amber'
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Deep insights into property performance, maintenance resolution rates, and booking utilization.',
    color: 'blue'
  },
  {
    icon: '🔐',
    title: 'Role-Based Access',
    description: 'Every user sees only what they need — admins, property owners, tenants, and maintenance staff.',
    color: 'rose'
  }
];

const roles = [
  {
    icon: '🛡️',
    title: 'Admin',
    description: 'Complete platform oversight and management',
    perks: ['Manage all properties & users', 'View system analytics', 'Configure platform settings', 'Access audit logs']
  },
  {
    icon: '🏠',
    title: 'Property Owner',
    description: 'Full control over your properties',
    perks: ['Add & manage properties', 'View tenant roster', 'Track maintenance queue', 'Manage amenities']
  },
  {
    icon: '🙋',
    title: 'Tenant',
    description: 'Seamless renting experience',
    perks: ['Submit maintenance requests', 'Book amenities', 'Track request status', 'View booking history']
  },
  {
    icon: '🔩',
    title: 'Maintenance Staff',
    description: 'Efficient job management',
    perks: ['View assigned requests', 'Update job status', 'Access request details', 'Real-time notifications']
  }
];

export default Home;
