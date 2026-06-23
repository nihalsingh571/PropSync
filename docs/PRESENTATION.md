# NeighborFit: Project Overview & Architecture
*A Sophisticated Neighborhood-Lifestyle Matching Platform*

---

<!-- Slide 1 -->
## 🏠 NeighborFit
### Find Your Perfect Neighborhood Match

**Presenter:** Anjali Sinha
**Role:** Full-Stack Developer
**Date:** February 2026

---

<!-- Slide 2 -->
## 🎯 The Problem & Solution

### The Challenge
*   Finding a home is easy; finding the right *neighborhood* is hard.
*   Users struggle to balance safety, commute, lifestyle, and budget.
*   Existing platforms focus on property listings, not community vibe.

### The NeighborFit Solution
*   **Lifestyle-First Approach**: We match users to neighborhoods based on *who they are*, not just what they can afford.
*   **Data-Driven Insights**: Aggregating safety, walkability, and amenities data.
*   **AI-Powered Matching**: A weighted algorithm personalized to every user.

---

<!-- Slide 3 -->
## ✨ Core User Features

*   **Smart Matching Engine**: Analyzes 6 key lifestyle metrics to create a compatibility score (0-100%).
*   **Interactive Dashboard**: Visualizes match data, recommended cities, and saved preferences.
*   **Advanced Search & Filter**: Real-time filtering by city, budget, safety rating, and more.
*   **Community Reviews**: Authentic feedback from actual residents.
*   **Visual Exploration**: Rich imagery and detailed metric breakdowns for every neighborhood.

---

<!-- Slide 4 -->
## 🛠️ Technology Stack

### Frontend (Client)
*   **Core**: React 19 + TypeScript + Vite
*   **State Management**: Zustand (UI) + React Query (Server State)
*   **Routing**: React Router v7
*   **Visualization**: Recharts (for Analytics & Dashboards)
*   **Styling**: Custom CSS Variables (Themed)

### Backend (Server)
*   **Runtime**: Node.js + Express.js
*   **Database**: MongoDB + Mongoose ODM (Atlas ready)
*   **Real-time**: Socket.io (Events & Live Updates)
*   **Security**: JWT Auth, Bcrypt, CORS, Helmet
*   **Utilities**: Multer (Uploads), PDFKit (Exports)

---

<!-- Slide 5 -->
## 🧠 The Matching Algorithm

A sophisticated weighted scoring system that acts as the core IP of NeighborFit.

1.  **Metric Analysis** (Weighted):
    *   🛡️ **Safety**: 25%
    *   💰 **Affordability**: 20%
    *   🧹 **Cleanliness**: 15%
    *   🚶 **Walkability**: 15%
    *    **Transit**: 15%
    *   🎉 **Nightlife**: 10%

2.  **Bonus Factors**:
    *   Community Rating Boost
    *   Demographic Synergy (Family/Age match)
    *   Amenity Density (Schools, Parks)

---

<!-- Slide 6 -->
## 🚀 Major Update: Admin Platform Upgrade

We recently completed a comprehensive overhaul to support **10k+ users** and **real-time operations**.

### Architecture Goals
*   **Latency**: <2s for real-time updates.
*   **Scalability**: M10+ MongoDB Cluster ready.
*   **Security**: Full RBAC (Role-Based Access Control).

### Implementation Phases (Completed)
*   **Phase 1**: Backend Foundation & Analytics Services.
*   **Phase 2**: Frontend Shell & State Layer.
*   **Phase 3**: Analytics Dashboard with Data Visualization.
*   **Phase 4**: Advanced User Management.
*   **Phase 5**: Neighborhood Management & Bulk Ops.
*   **Phase 6**: Real-time Monitoring System.

---

<!-- Slide 7 -->
## 📊 Admin Capabilities

The new Admin Portal is a powerhouse for platform management:

*   **Live Operations**:
    *   Real-time "Online Users" counter.
    *   Live activity feed (Registrations, Updates).
*   **Analytics Suite**:
    *   User Growth Trends (Line Charts).
    *   City Distribution & Demographics (Pie/Bar Charts).
    *   Neighborhood Performance (Views vs. Match Rate).
*   **Data Management**:
    *   **Bulk Actions**: Suspend/Activate users, CSV Import/Export.
    *   **Neighborhood Editor**: Tabbed interface for metrics & images.
*   **System Health**:
    *   Database & Cache status monitoring.

---

<!-- Slide 8 -->
## 🔄 Real-Time Event Architecture

NeighborFit uses **Socket.io** to keep the Admin UI in sync without page reloads.

| Event Name | Trigger | Action |
| :--- | :--- | :--- |
| `new_user_registered` | User Signup | Updates Dashboard Counters & Feed |
| `neighborhood_updated` | CRUD Action | Refreshes Data Tables |
| `admin_action_performed` | Bulk Ops | Logs to Activity Monitor |
| `live_user_count` | 30s Polling | Updates "Active Users" Card |

*Fallback Strategy: React Query auto-refetching (60s).*

---

<!-- Slide 9 -->
## 🔒 Security & Deployment

### Security Layers
*   **Authentication**: Secure JWT (Hung-Only Cookies recommended for prod).
*   **RBAC**: Middleware checks for `super_admin` vs `admin`.
*   **Data Safety**: Soft-delete implementation for user data.
*   **Audit Logging**: Every admin action is recorded for accountability.

### Deployment Pipeline
*   **Frontend**: Vercel (Static Generation).
*   **Backend**: Vercel (Serverless Functions) or specialized Node host.
*   **Database**: MongoDB Atlas (Cloud).
*   **CI/CD**: Manual deploy scripts prepared (`start-dev.sh`).

---

<!-- Slide 10 -->
## 📈 Future Roadmap

### Short Term (Q2 2026)
*   �️ **Interactive Maps**: Mapbox/Google Maps integration for boundary visualization.
*   📱 **Mobile App**: React Native adaptation for iOS/Android.

### Medium Term
*   🧠 **ML Recommendations**: Collaborative filtering based on user similarity.
*   🏘️ **Social Hubs**: Neighborhood-specific discussion boards.

### Technical
*   **Redis Caching**: For heavy analytics queries.
*   **Elasticsearch**: For fuzzy search text queries.

---

<!-- Slide 11 -->
## 🏁 Conclusion

NeighborFit is more than a directory; it's a decision-making engine for modern living.

*   **Status**: Production-Ready (Core + Admin).
*   **Codebase**: Clean, Modular, Typed (TypeScript).
*   **Documentation**: Comprehensive Coverage (Docs/ + README).

**Thank You!**
*Questions?*
