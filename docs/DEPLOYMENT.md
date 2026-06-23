# Deployment Guide for NeighborFit

## 🚀 Deployment Strategy: Split Hosting

Because this project uses **Socket.io** (WebSockets) and background tasks for the Admin Platform, the backend requires a **stateful** hosting environment. Vercel Serverless functions are stateless and **will not support** the real-time features reliably.

**Recommendation**:
- **Frontend (Client)**: Deploy to **Vercel** (Excellent for static/SPA sites).
- **Backend (Server)**: Deploy to **Render**, **Railway**, or **Heroku** (Supports long-running Node.js processes).

---

## Prerequisites

1. **GitHub Repository**: Code pushed to GitHub.
2. **MongoDB Atlas**: Database cluster set up.
3. **Accounts**: Sign up for [Vercel](https://vercel.com) and [Render](https://render.com).

---

## Part 1: Deploy Backend (Render)

We recommended Render for its easy free tier and native Node.js support.

1. **Create Service**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repo.

2. **Configuration**:
   - **Root Directory**: `server` (Important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter for better performance)

3. **Environment Variables** (Add these in the "Environment" tab):
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `your_atlas_connection_string`
   - `JWT_SECRET`: `your_secure_secret`
   - `CLIENT_URL`: `https://your-frontend-project.vercel.app` (You will update this after Part 2)
   - `PORT`: `10000` (Render default)

4. **Deploy**:
   - Click **Create Web Service**.
   - Wait for the build to finish.
   - **Copy the Backend URL** (e.g., `https://neighborfit-api.onrender.com`).

---

## Part 2: Deploy Frontend (Vercel)

1. **Create Project**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Import your repository.
   - Set **Root Directory** to `client` (Click "Edit" next to Root Directory).

2. **Configure Build**:
   - **Framework Preset**: Vite (should auto-detect).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**:
   - `VITE_API_URL`: Paste your **Render Backend URL** (e.g., `https://neighborfit-api.onrender.com/api`)
     > **Note**: Ensure you append `/api` if your client expects it, or just the base URL depending on your `api.ts` config.

4. **Deploy**:
   - Click **Deploy**.

---

## Part 3: Final Wiring

1. **Update Backend CORS**:
   - Go back to **Render Dashboard** -> Your Service -> Environment.
   - Update `CLIENT_URL` to match your new **Vercel Frontend URL** (e.g., `https://neighborfit.vercel.app`).
   - Render will auto-redeploy.

2. **Verify Admin Socket**:
   - Login to the Admin Portal.
   - Check if the "Real-time" indicator is active.
   - If red/disconnected, check console logs for 400/ConnectionRefused errors (usually CORS or wrong URL).

---

## Troubleshooting

### Socket.io Connection Issues
- Ensure `VITE_API_URL` does **not** have a trailing slash if your code appends one.
- Ensure Render environment variable `CLIENT_URL` matches exactly (no trailing slash).
- Render Free Tier spins down after inactivity; initial connection might take 50s to wake up.

### Database
- Ensure MongoDB Atlas "Network Access" allows `0.0.0.0/0` (Anywhere) so Render can connect.

### Build Failures
- **Client**: "Module not found"? Check case sensitivity in imports.
- **Server**: "Script not found"? Ensure Root Directory is set to `server`.