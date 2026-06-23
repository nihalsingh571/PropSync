# NeighborFit Admin Platform – Architecture Blueprint

_Last updated: February 5, 2026_

**Status: Phases 0–7 Completed** (See README.md for implementation details)

This document captures the architecture principles and decisions that guided the Admin Platform Upgrade. It serves as a reference for the existing implementation.

---

## 1. Non-Functional Targets

| Goal | Target | Notes |
| --- | --- | --- |
| Scale | 10,000 active users, 500 neighborhoods | Data models and queries sized for MongoDB cluster tier M10+. |
| Realtime latency | < 2 seconds end-to-end | Socket.io primary channel, polling fallback at 60s. |
| Availability | 99.5% for admin APIs | Health checks + backup strategy. |
| Security | All admin routes JWT + role check + activity logging | Support `super_admin`, `admin`, `support`. |
| Responsiveness | 60 FPS interactions on modern laptops/tablets | Virtualized tables, memoized charts. |

---

## 2. Tech Stack Choices

### Frontend
- **React 19 + TypeScript** (existing).
- **React Router**: nested `/admin/*` routes.
- **React Query**: data fetching/caching/invalidation.
- **Zustand**: lightweight global admin UI state (theme, selections, filters).
- **Socket.io client**: realtime events.
- **Recharts**: line/bar/pie/heatmap charts.
- **TanStack Table v8**: powerful data tables with virtualized rows.
- **react-hook-form + zod**: forms + validation (neighborhood editor).
- **file-saver + json2csv + jsPDF**: exports (CSV/PDF).
- **Dropzone / native File API**: CSV import & image uploads.

### Backend
- **Node.js + Express** (existing).
- **Mongoose** for schema updates.
- **Socket.io server** (attached to Express HTTP server).
- **Multer** (CSV uploads), **csv-parse** (parsing), **pdfkit** (PDF export).
- **BullMQ / lightweight queue** (optional) for backups/imports.
- **Winston** for admin activity logging.
- **dotenv** for configuration.

### Service Boundaries
```
server/
├── controllers/
│   ├── adminDashboardController.js
│   ├── adminUserController.js
│   ├── adminNeighborhoodController.js
│   └── systemController.js
├── services/
│   ├── analyticsService.js        # Aggregations + caching
│   ├── adminService.js            # User/neighborhood actions, bulk ops
│   ├── activityLogService.js      # Admin audit logs
│   ├── fileImportService.js       # CSV ingestion
│   ├── exportService.js           # CSV/PDF
│   └── realtimeService.js         # Socket event helpers
└── websocket/
    └── adminGateway.js            # Namespaced Socket.io handlers
```

---

## 3. Data Model & ERD Updates

### Schema Additions
- `users`
  - `last_active: Date`
  - `familyStatus: 'single' | 'couple' | 'family_with_kids' | 'retired'`
  - `city: String`
  - `roles: ['user', 'admin', 'super_admin', 'support']`
  - `softDeleted: Boolean` (default false)
  - `suspended: Boolean`
- `neighborhoods`
  - `viewCount: Number (default 0)`
  - `matchSuccessRate: Number (0-100)`
  - `sentimentScore: Number (-1 to 1)`
  - `images: [String]`
- `admin_activity_logs`
  - `action`, `entityType`, `entityId`, `adminId`, `payloadSnapshot`, `ip`, `createdAt`, `undoToken`
- `analytics_cache`
  - `key`, `payload`, `ttl`, `lastUpdated`

### ERD (ASCII)
```
[User]
  _id
  name
  email
  roles[]
  last_active
  softDeleted
  suspended
     |
     |1
     |                               [AdminActivityLog]
     |------------------------------< adminId

[UserPreferences] --1:1--> [User]

[Neighborhood]
  _id
  city
  metrics{}
  viewCount
  matchSuccessRate
     ^
     |*
     |                               [Review]
     |-----------------------------< neighborhoodId

[AnalyticsCache] (key => payload)
```

---

## 4. API Contracts (Draft)

| Method | Endpoint | Query/Body | Response (shape) |
| --- | --- | --- | --- |
| GET | `/api/admin/dashboard-stats?range=7d` | `range`: 7d/30d/90d | `{ totals: { users, newUsers, neighborhoods, reviews }, live: { onlineUsers, activeMatches }, heatmap: [[hour, count]], cards: [...] }` |
| GET | `/api/admin/user-analytics?range=30d` | same | `{ dailyCounts: [{ date, users }], demographics: { ageBuckets, familyStatus }, registrationsByCity }` |
| GET | `/api/admin/neighborhood-analytics?range=30d` | filters | `{ cityDistribution: [...], topRated: [...], sentimentTrend: [...], popularity: [...] }` |
| GET | `/api/admin/activity-log?page=1&limit=25&action=DELETE` | pagination + filters | `{ data: [ { action, admin, entity, diff, createdAt, ip } ], meta: { page, total } }` |
| POST | `/api/admin/users/bulk-actions` | `{ action: 'suspend'|'activate'|'email'|'delete', userIds: [], payload? }` | `{ success: true, processed, failed[] }` |
| GET | `/api/admin/users/:id` | — | `{ user, preferences, activity, reviews }` |
| POST | `/api/admin/neighborhoods/import` | multipart CSV | `{ success, inserted, errors[] }` |
| GET | `/api/admin/system-health` | — | `{ uptime, dbStatus, cacheStatus, jobQueue, socketClients }` |
| POST | `/api/admin/backup` | `{ mode: 'full'|'incremental' }` | `{ jobId, status }` |

All endpoints require `Authorization: Bearer <token>` + `role in ['admin','super_admin']`; some actions restricted to `super_admin`.

---

## 5. WebSocket Event Flows

| Event | Emitted By | Payload | Consumers |
| --- | --- | --- | --- |
| `new_user_registered` | Auth controller after registration | `{ userId, name, city, timestamp }` | Admin dashboard counters, activity feed |
| `neighborhood_updated` | Neighborhood controller (create/update/delete/import) | `{ neighborhoodId, action, adminId }` | Neighborhood table, change notifications |
| `admin_action_performed` | Admin middleware post-success | `{ adminId, action, entityType, entityId }` | Activity log feed, real-time audit |
| `system_alert` | System controller or health monitor | `{ severity, message, timestamp }` | Admin notifications center |
| `live_user_count` | Cron/polling job every 30s | `{ count }` | Dashboard stat card |

Flow:
1. Controller/service performs business logic.
2. `realtimeService.emit(event, payload)` pushes to namespace `/admin`.
3. Client `WebSocketProvider` receives event → dispatches to Zustand store & `queryClient.setQueryData`.
4. UI updates (stat cards, tables) without manual refresh.

Fallback: `React Query` auto-refetch every 60s + manual “Refresh” button.

---

## 6. RBAC Matrix

| Capability | Support | Admin | Super Admin |
| --- | --- | --- | --- |
| View dashboard & analytics | ✅ | ✅ | ✅ |
| Manage users (toggle roles, suspend) | ❌ | ✅ | ✅ |
| Impersonate user | ✅ (view-only scope) | ✅ | ✅ |
| Delete users (soft delete) | ❌ | ✅ | ✅ |
| Restore deleted users | ❌ | ✅ | ✅ |
| Manage neighborhoods (CRUD/import/export) | ❌ | ✅ | ✅ |
| Trigger backups / cache clear | ❌ | ❌ | ✅ |
| Grant admin roles | ❌ | ❌ | ✅ |
| View activity log | ✅ | ✅ | ✅ |

Implementation: `requireAdmin(['users.write'])` middleware referencing permission map.

---

## 7. Caching & Backup Strategy

### Caching
- `analytics_cache` collection holds pre-computed payloads keyed by `stats:<range>`, TTL 5 minutes.
- `React Query` handles client caching; invalidations triggered on WebSocket events for relevant queries.
- `Redis` optional future enhancement; not required initially.

### Backup & Recovery
- Endpoint `/api/admin/backup` queues backup job (MongoDB dump or Atlas snapshot API call).
- Store metadata in `admin_activity_logs` with undo link.
- Provide UI button for super admins; display status via `/api/admin/system-health`.
- Cache clear button hits `/api/admin/system-health/cache` (future).

---

## 8. Component Hierarchy (High-Level)

```
<AdminApp>
  ├─ <AdminLayout>
  │    ├─ <AdminHeader>
  │    │    ├─ <NotificationBell />
  │    │    └─ <UserMenu />
  │    ├─ <AdminSidebar />
  │    └─ <AdminContent>
  │         ├─ <AdminDashboard>
  │         │    ├─ <StatCards />
  │         │    ├─ <ChartCard type="line" />
  │         │    ├─ <ChartCard type="bar" />
  │         │    ├─ <ChartCard type="pie" />
  │         │    ├─ <ActivityFeed />
  │         │    └─ <ActivityMonitor />   ← live Socket.IO events
  │         ├─ <UsersManagement>
  │         │    ├─ <Toolbar />
  │         │    ├─ <DataTable />
  │         │    └─ <UserDetailModal />
  │         ├─ <NeighborhoodsManagement>
  │         │    ├─ <FiltersPanel />
  │         │    ├─ <DataTable />
  │         │    └─ <NeighborhoodFormModal />
  │         ├─ <AnalyticsPage />
  │         └─ <SettingsPage />
  └─ <WebSocketProvider>
       └─ {children}
```

---

## 9. Deployment Considerations
- Ensure Socket.io path (`/ws/admin`) exposed through reverse proxy.
- Add environment flags for admin polling intervals and cache TTL.
- `LIVE_USERS_POLL_MS` controls how often the server broadcasts live user counts (defaults to 30s).
- Document new env vars in README/DEPLOYMENT.

---

**Next Steps:** Proceed to Phase 1 tasks (schema migrations + backend endpoints) using this blueprint.
