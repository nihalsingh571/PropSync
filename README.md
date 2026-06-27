# 🏢 PropSync — Property Rental, Maintenance & Amenity Management Platform

> **Full-stack SaaS** for managing rental properties, tenants, maintenance workflows, and shared amenities — built with the MERN stack (MongoDB · Express · React · Node.js).

[![GitHub](https://img.shields.io/badge/GitHub-nihalsingh571%2FPropSync-blue?logo=github)](https://github.com/nihalsingh571/PropSync)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Demo-prop--sync.vercel.app-purple?logo=vercel)](https://prop-sync.vercel.app/)

---

## 🌐 Live Demo

You can access the live application here: **[https://prop-sync.vercel.app/](https://prop-sync.vercel.app/)**

---

## 📸 Screenshots

| Landing Page | Login Screen |
|:---:|:---:|
| ![Landing Page](./screenshots/landing_page.png) | ![Login Screen](./screenshots/login_page.png) |

| Admin Dashboard | Owner Dashboard |
|:---:|:---:|
| ![Admin Dashboard](./screenshots/admin_dashboard.png) | ![Owner Dashboard](./screenshots/owner_dashboard.png) |

| Properties Listing |
|:---:|
| ![Properties Listing](./screenshots/properties_list.png) |

---

## ✨ Features

| Domain | Highlights |
|---|---|
| **Authentication & RBAC** | JWT auth, role-based access (Admin · Property Owner · Tenant · Maintenance Staff), password reset |
| **Property Management** | CRUD for properties, image support, status tracking |
| **Tenant Management** | Lease lifecycle (active → notice → vacated), document storage, lease expiry alerts |
| **Maintenance Requests** | Full state machine (Open → Assigned → In Progress → Pending Review → Resolved), staff assignment, feedback & rating |
| **Amenity Management** | Booking system with conflict detection, capacity limits, approval workflows, booking stats |
| **Notification System** | In-app notification bell, read/unread management, TTL auto-purge (90 days), event-driven triggers |
| **Role Dashboards** | Personalised dashboards for every role (Tenant, Owner, Staff, Admin) |
| **Admin Panel** | Full analytics with Recharts, user management, live activity feed via Socket.IO |

---

## 🛠️ Tech Stack

**Backend**
- Node.js 20 + Express 4
- MongoDB Atlas + Mongoose 7
- Socket.IO 4 (real-time events)
- JWT + bcrypt (auth)
- SendGrid (email, optional)

**Frontend**
- React 18 + TypeScript
- Vite 5 (bundler)
- TanStack React Query (server state)
- React Router 6
- Recharts (admin analytics)
- Vanilla CSS (no Tailwind dependency)

---

## 📁 Project Structure

```
PropSync/
├── client/               # React + TypeScript SPA (Vite)
│   ├── src/
│   │   ├── components/   # Shared UI components (Navbar, Admin layout, etc.)
│   │   ├── contexts/     # Auth, Toast, Realtime contexts
│   │   ├── lib/          # API clients (propertyApi, tenantApi, notificationApi…)
│   │   ├── pages/        # Route-level pages per domain
│   │   └── stores/       # Zustand admin store
│   ├── vercel.json       # Vercel deployment config
│   └── .env.example      # Frontend env vars template
│
└── server/               # Express API
    ├── controllers/      # Request handlers
    ├── models/           # Mongoose schemas
    ├── routes/           # Express routers
    ├── services/         # Business logic (amenity, notification, realtime…)
    ├── middleware/        # Auth, error handling
    ├── render.yaml       # Render.com deployment config
    └── .env.example      # Backend env vars template
```

---

## 🚀 Local Development

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- npm ≥ 9

### 1. Clone & Install

```bash
git clone https://github.com/nihalsingh571/PropSync.git
cd PropSync
npm install          # installs root + all workspaces
```

### 2. Configure Environment

```bash
# Backend
cp server/.env.example server/.env
# Edit server/.env — set MONGODB_URI and JWT_SECRET

# Frontend (optional — defaults to localhost:8000)
cp client/.env.example client/.env.local
```

### 3. Start Dev Servers

```bash
# Terminal 1 — Backend (http://localhost:8000)
npm run dev:server

# Terminal 2 — Frontend (http://localhost:5173)
npm run dev:client
```

Or start both together (if you have concurrently installed):

```bash
npm run dev
```

### 4. Seed Data (Optional)

```bash
npm run seed --workspace server
```

---

## ☁️ Deployment

### Backend → Render.com

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo → set **Root Directory** to `server`
3. Render auto-detects `render.yaml` — review the settings
4. In the **Environment** tab, set:
   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | Your Atlas connection string |
   | `CLIENT_URL` | Your Vercel frontend URL (e.g. `https://prop-sync.vercel.app`) |
5. Click **Deploy**. Note your API URL (e.g. `https://propsync-api.onrender.com`).

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
2. Set **Root Directory** to `client`
3. Add Environment Variable:
   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://propsync-api.onrender.com/api` |
4. Click **Deploy**. Vercel auto-detects the Vite framework.
5. Copy your Vercel URL and paste it back into Render as `CLIENT_URL`.

> ⚠️ **Free tier note**: Render free tier spins down after 15 minutes of inactivity. The first request after sleep may take 30–60 seconds. Upgrade to Starter ($7/mo) for always-on.

---

## 👤 Default Roles

| Role | Access |
|---|---|
| `admin` | Full system access, user management, analytics |
| `property_owner` | Own properties, tenants, maintenance, amenities |
| `tenant` | Own lease, maintenance requests, amenity bookings |
| `maintenance_staff` | Assigned maintenance requests |

New accounts default to `tenant`. An admin must upgrade roles via the Admin → Users panel.

---

## 📡 API Endpoints

| Base Path | Description |
|---|---|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Login, receive JWT |
| `/api/properties` | Property CRUD (owner/admin) |
| `/api/tenants` | Tenant CRUD + lease management |
| `/api/maintenance` | Maintenance request lifecycle |
| `/api/amenities` | Amenity CRUD + booking system |
| `/api/notifications` | Notification management |
| `/api/admin/*` | Admin analytics + user management |

Full API responses follow: `{ message, data, meta }` convention.

---

## 🔒 Security

- All `.env` files are excluded from git via `.gitignore`
- JWT tokens expire after `JWT_EXPIRE` (default 30 days)
- Passwords hashed with bcrypt (10 rounds)
- CORS restricted to `CLIENT_URL` origins in production
- HTTP security headers set via Vercel config (`X-Frame-Options`, `X-Content-Type-Options`, etc.)

---

## 📄 License

MIT © 2024 [Nihal Kumar Singh](https://github.com/nihalsingh571)
