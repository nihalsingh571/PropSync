# NeighborFit Development Guide

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

### Starting the Application

The recommended way to start the development environment (both backend and frontend) is using the helper script:

```bash
./start-dev.sh
```

This will launch:
- **Backend API**: http://localhost:8000
- **Frontend App**: http://localhost:5173

### Database Setup

1. **Seed the database with sample neighborhoods:**
   ```bash
   cd server && npm run seed
   ```

   This populates the database with 30+ curated neighborhoods and high-quality image URLs.

### API Endpoints

- `GET /api/neighborhoods` - Get all neighborhoods
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Save user preferences
- `GET /api/admin/*` - Admin specific routes (see `admin-architecture.md`)

### Environment Configuration

#### Server (.env in server folder):
```
MONGODB_URI=mongodb://localhost:27017/neighborfit
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
LIVE_USERS_POLL_MS=30000
```

#### Client (.env in client folder):
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=NeighborFit
VITE_APP_VERSION=1.0.0
NODE_ENV=development
```

### Troubleshooting

#### Port Conflicts
If ports 8000 or 5173 are in use, the startup script might fail or Vercel will pick a random port.
- Kill processes: `lsof -ti:8000 | xargs kill -9`

#### MongoDB Connection
Ensure MongoDB is running locally or your `MONGODB_URI` points to a valid Atlas cluster.

### Project Structure (Updated)

```
neighborfit/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Admin & User Pages
│   │   ├── contexts/       # Auth & Realtime Contexts
│   │   └── assets/         # Static assets
├── server/                 # Node.js backend (Express)
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   └── services/           # Business logic (Analytics, Realtime)
└── start-dev.sh            # One-click startup script
```

### Next Steps for Development

1. **Admin Portal:** Check `docs/admin-architecture.md` for the latest architecture.
2. **Realtime Events:** See `docs/realtime-events-testing.md` for testing Socket.io flows.
3. **Deployment:** Refer to `docs/DEPLOYMENT.md` for Vercel setup.

### Common Commands

```bash
# Install dependencies
npm install                    # Root
cd client && npm install      # Frontend
cd server && npm install      # Backend

# Development
./start-dev.sh                # Start everything

# Seeding
cd server && npm run seed

# Promote Admin
cd server && node scripts/promoteAdmin.js <email>
```