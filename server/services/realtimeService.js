import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

let ioInstance = null;
let adminNamespace = null;
let userNamespace = null;
// Phase 9: let maintenanceNamespace = null;
// Phase 9: let bookingsNamespace = null;
let liveUserInterval = null;

const DEFAULT_ACTIVE_WINDOW_MINUTES = 15;

const withTimestamp = (payload = {}) => ({
  ...payload,
  timestamp: payload.timestamp || new Date().toISOString()
});

// ─── Auth middleware for authenticated namespaces ─────────────────────────────
const jwtSocketMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.join(decoded.id.toString());
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};

// ─── Init Socket.io ───────────────────────────────────────────────────────────
export const initRealtime = (httpServer, options = {}) => {
  if (!httpServer) {
    throw new Error('HTTP server instance is required to initialize realtime layer');
  }

  ioInstance = new Server(httpServer, {
    cors: options.cors || { origin: '*', credentials: true }
  });

  // Admin namespace — broadcast to all admin clients
  adminNamespace = ioInstance.of('/admin');
  adminNamespace.on('connection', (socket) => {
    socket.emit('connected', { id: socket.id, timestamp: new Date().toISOString() });
    socket.on('disconnect', () => {});
  });

  // Users namespace — authenticated per-user rooms
  userNamespace = ioInstance.of('/users');
  userNamespace.use(jwtSocketMiddleware);
  userNamespace.on('connection', (socket) => {
    socket.emit('connected', { id: socket.id, timestamp: new Date().toISOString() });
  });

  // Phase 9: Add /maintenance namespace (authenticated)
  // maintenanceNamespace = ioInstance.of('/maintenance');
  // maintenanceNamespace.use(jwtSocketMiddleware);
  // maintenanceNamespace.on('connection', (socket) => { ... });

  // Phase 9: Add /bookings namespace (authenticated)
  // bookingsNamespace = ioInstance.of('/bookings');
  // bookingsNamespace.use(jwtSocketMiddleware);
  // bookingsNamespace.on('connection', (socket) => { ... });

  return ioInstance;
};

// ─── Emit Helpers ─────────────────────────────────────────────────────────────

const emitToAdmin = (event, payload) => {
  if (adminNamespace) {
    adminNamespace.emit(event, withTimestamp(payload));
  }
};

const emitToUser = (userId, event, payload) => {
  if (userNamespace && userId) {
    userNamespace.to(userId.toString()).emit(event, withTimestamp(payload));
  }
};

export const emitChatMessage = (receiverId, payload) =>
  emitToUser(receiverId, 'new_chat_message', payload);

// ─── Admin Events ─────────────────────────────────────────────────────────────

export const emitNewUserRegistered = (payload) =>
  emitToAdmin('new_user_registered', payload);

export const emitPropertyUpdated = (payload) =>
  emitToAdmin('property_updated', payload);

export const emitAdminActionEvent = (payload) =>
  emitToAdmin('admin_action_performed', payload);

export const emitSystemAlert = (payload) =>
  emitToAdmin('system_alert', payload);

export const emitLiveUserCount = (count) =>
  emitToAdmin('live_user_count', { count });

export const emitDashboardStatsUpdated = (payload = {}) =>
  emitToAdmin('dashboard:stats_updated', payload);

// ─── User Events ──────────────────────────────────────────────────────────────

export const emitNewNotification = (userId, notification) =>
  emitToUser(userId, 'notification:new', notification);

// ─── Phase 9 — Maintenance & Booking Events (stubs) ──────────────────────────
// export const emitMaintenanceStatusUpdated = (requestId, newStatus, recipientIds) => { ... }
// export const emitMaintenanceAssigned = (requestId, staffId) => { ... }
// export const emitBookingConfirmed = (bookingId, tenantId) => { ... }
// export const emitBookingCancelled = (bookingId, tenantId) => { ... }
// export const emitAmenityAvailabilityUpdated = (amenityId) => { ... }

// ─── Polling Loops ────────────────────────────────────────────────────────────

const computeLiveUserCount = async () => {
  const cutoff = new Date(Date.now() - DEFAULT_ACTIVE_WINDOW_MINUTES * 60 * 1000);
  const count = await User.countDocuments({
    softDeleted: false,
    suspended: false,
    lastActive: { $gte: cutoff }
  });
  emitLiveUserCount(count);
  return count;
};

export const startRealtimeLoops = ({ liveUserIntervalMs = 30_000 } = {}) => {
  if (liveUserInterval) {
    clearInterval(liveUserInterval);
  }

  const run = async () => {
    try {
      await computeLiveUserCount();
    } catch (error) {
      console.error('Failed to broadcast live user count:', error.message);
    }
  };

  run();
  liveUserInterval = setInterval(run, liveUserIntervalMs);
};
