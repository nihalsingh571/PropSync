# Testing Realtime Events (Postman / curl)

This guide shows how to trigger and verify the three admin Socket.IO events.

**Prerequisites**

- Server running: `./start-dev.sh` (or `npm run dev:server` in server dir).
- Optional: listener running to see events: `cd server && npm run listen-admin`.

Base URL: `http://localhost:8000` (or your `API_URL`).

---

## 1. `new_user_registered`

**Trigger:** `POST /api/auth/register`

**Expected event:** `new_user_registered` on namespace `/admin` with payload like `{ userId, name, email, timestamp }`.

### curl

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test-'$(date +%s)'@example.com","password":"password123"}'
```

### Postman

- **Method:** POST  
- **URL:** `http://localhost:8000/api/auth/register`  
- **Headers:** `Content-Type: application/json`  
- **Body (raw JSON):**

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

Use a unique email each time (e.g. `test1@example.com`, `test2@example.com`).

---

## 2. `neighborhood_updated` (action `created`)

**Trigger:** `POST /api/neighborhoods` with an **admin** JWT.

**Expected event:** `neighborhood_updated` on `/admin` with payload like `{ action: "created", neighborhoodId, adminId, name, city, timestamp }`.

### Get an admin token

1. Log in as an admin user, or promote a user to admin (see `server/scripts/promoteAdmin.js`).
2. `POST /api/auth/login` with admin credentials; copy the `token` from the response.

### curl

```bash
# Replace YOUR_ADMIN_TOKEN with the token from login
curl -X POST http://localhost:8000/api/neighborhoods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name":"Test Neighborhood","city":"Test City","state":"TS"}'
```

### Postman

- **Method:** POST  
- **URL:** `http://localhost:8000/api/neighborhoods`  
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body (raw JSON):**

```json
{
  "name": "Test Neighborhood",
  "city": "Test City",
  "state": "TS"
}
```

---

## 3. `admin_action_performed`

**Trigger:** `POST /api/admin/users/bulk-actions` with an **admin** JWT.

**Expected event:** `admin_action_performed` on `/admin` with payload like `{ adminId, action, entityType, entityId, metadata, timestamp }`.

### curl

```bash
# Replace YOUR_ADMIN_TOKEN and USER_ID with real values (user IDs from GET /api/auth/users or DB)
curl -X POST http://localhost:8000/api/admin/users/bulk-actions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"action":"activate","userIds":["USER_ID"]}'
```

Valid `action` values: `suspend`, `activate`, `softDelete`, `restore`, `setAdmin`, `removeAdmin`.

### Postman

- **Method:** POST  
- **URL:** `http://localhost:8000/api/admin/users/bulk-actions`  
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body (raw JSON):**

```json
{
  "action": "activate",
  "userIds": ["USER_MONGO_OBJECT_ID"]
}
```

---

## Verifying events (Socket.IO)

**Option A – Listener script (recommended)**

1. In one terminal: `./start-dev.sh`
2. In another: `cd server && npm run listen-admin`
3. In a third (or Postman), run the requests above. You should see the corresponding events printed in the listener terminal.

**Option B – Postman / custom client**

Connect to the Socket.IO namespace `http://localhost:8000/admin` (e.g. with a Socket.IO client or Postman’s WebSocket/Socket.IO support) and listen for:

- `new_user_registered`
- `neighborhood_updated`
- `admin_action_performed`

All events are emitted to the `/admin` namespace and include a `timestamp` field (added by the server).
