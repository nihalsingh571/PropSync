// server/services/notificationService.js — PropSync v2
// In-app notification system: create, list, read/unread, bulk mark-read, delete

import Notification from '../models/notificationModel.js';
import mongoose from 'mongoose';

// ── Create a notification ──────────────────────────────────────────────────────
export const createNotification = async ({
  recipientId,
  type,
  title,
  body,
  linkedEntityType = null,
  linkedEntityId = null,
  actionUrl = null,
  channels = { inApp: true, email: false }
}) => {
  return Notification.create({
    recipientId,
    type,
    title,
    body,
    linkedEntityType,
    linkedEntityId: linkedEntityId ? new mongoose.Types.ObjectId(String(linkedEntityId)) : null,
    actionUrl,
    channels
  });
};

// ── Bulk create (fan-out to multiple recipients) ───────────────────────────────
export const broadcastNotification = async (recipientIds, payload) => {
  const docs = recipientIds.map(id => ({
    ...payload,
    recipientId: new mongoose.Types.ObjectId(String(id)),
    linkedEntityId: payload.linkedEntityId
      ? new mongoose.Types.ObjectId(String(payload.linkedEntityId))
      : null
  }));
  return Notification.insertMany(docs, { ordered: false });
};

// ── List notifications for a user ─────────────────────────────────────────────
export const listNotifications = async ({
  recipientId,
  unreadOnly = false,
  page = 1,
  limit = 20
}) => {
  const filter = { recipientId: new mongoose.Types.ObjectId(String(recipientId)) };
  if (unreadOnly) filter.read = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: filter.recipientId, read: false })
  ]);

  return {
    notifications,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    },
    unreadCount
  };
};

// ── Get unread count only (for badge) ─────────────────────────────────────────
export const getUnreadCount = async (recipientId) => {
  const count = await Notification.countDocuments({
    recipientId: new mongoose.Types.ObjectId(String(recipientId)),
    read: false
  });
  return { unreadCount: count };
};

// ── Mark one notification as read ─────────────────────────────────────────────
export const markRead = async (id, recipientId) => {
  return Notification.findOneAndUpdate(
    { _id: id, recipientId: new mongoose.Types.ObjectId(String(recipientId)) },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );
};

// ── Mark all as read for a user ───────────────────────────────────────────────
export const markAllRead = async (recipientId) => {
  const result = await Notification.updateMany(
    { recipientId: new mongoose.Types.ObjectId(String(recipientId)), read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return { modifiedCount: result.modifiedCount };
};

// ── Delete a notification ──────────────────────────────────────────────────────
export const deleteNotification = async (id, recipientId, isAdmin) => {
  const filter = { _id: id };
  if (!isAdmin) filter.recipientId = new mongoose.Types.ObjectId(String(recipientId));
  return Notification.findOneAndDelete(filter);
};

// ── Purge all read notifications for a user ───────────────────────────────────
export const purgeRead = async (recipientId) => {
  const result = await Notification.deleteMany({
    recipientId: new mongoose.Types.ObjectId(String(recipientId)),
    read: true
  });
  return { deletedCount: result.deletedCount };
};

// ── Helper: send notifications for common PropSync events ─────────────────────
export const notifyMaintenanceSubmitted = async ({ tenantId, ownerId, requestId, title }) => {
  const promises = [];
  // Notify owner
  if (ownerId) {
    promises.push(createNotification({
      recipientId: ownerId,
      type: 'maintenance_submitted',
      title: '🔧 New Maintenance Request',
      body: `A new maintenance request has been submitted: "${title}"`,
      linkedEntityType: 'maintenance_request',
      linkedEntityId: requestId,
      actionUrl: `/maintenance/${requestId}`
    }));
  }
  return Promise.all(promises);
};

export const notifyMaintenanceStatusUpdated = async ({ tenantId, requestId, newStatus, note }) => {
  return createNotification({
    recipientId: tenantId,
    type: 'maintenance_status_updated',
    title: '🔧 Maintenance Update',
    body: `Your request status changed to "${newStatus}"${note ? ': ' + note : ''}`,
    linkedEntityType: 'maintenance_request',
    linkedEntityId: requestId,
    actionUrl: `/maintenance/${requestId}`
  });
};

export const notifyBookingConfirmed = async ({ tenantId, bookingId, amenityName, startTime }) => {
  const dt = new Date(startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  return createNotification({
    recipientId: tenantId,
    type: 'booking_confirmed',
    title: '📅 Booking Confirmed',
    body: `Your booking for "${amenityName}" on ${dt} is confirmed.`,
    linkedEntityType: 'booking',
    linkedEntityId: bookingId,
    actionUrl: `/amenities`
  });
};

export const notifyLeaseExpiring = async ({ tenantId, propertyName, daysLeft }) => {
  return createNotification({
    recipientId: tenantId,
    type: 'lease_expiring',
    title: '⚠️ Lease Expiring Soon',
    body: `Your lease at "${propertyName}" expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Please contact your landlord.`,
    actionUrl: `/my-lease`
  });
};
