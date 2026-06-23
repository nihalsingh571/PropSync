// server/models/notificationModel.js — PropSync v2
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // ── Recipient ─────────────────────────────────────────────────────────────────
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },

  // ── Notification Content ──────────────────────────────────────────────────────
  type: {
    type: String,
    enum: [
      // Maintenance
      'maintenance_submitted',     // tenant submitted a request
      'maintenance_assigned',      // staff was assigned a request
      'maintenance_status_updated',// status changed on a request
      'maintenance_resolved',      // request was resolved
      // Bookings
      'booking_confirmed',
      'booking_cancelled',
      'booking_reminder',
      'booking_checkin',
      'booking_checkout',
      // Tenant / Property
      'lease_expiring',
      'rent_due',
      'new_tenant_joined',
      'property_announcement',
      // System
      'admin_action',
      'system_alert',
      'welcome'
    ],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: 120
  },
  body: {
    type: String,
    required: [true, 'Notification body is required'],
    maxlength: 500
  },

  // ── Deep Link (for navigation) ────────────────────────────────────────────────
  linkedEntityType: {
    type: String,
    enum: ['maintenance_request', 'booking', 'property', 'tenant', 'amenity', null],
    default: null
  },
  linkedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  actionUrl: { type: String, default: null },   // frontend route path

  // ── Read State ────────────────────────────────────────────────────────────────
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },

  // ── Delivery ──────────────────────────────────────────────────────────────────
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false }
  },
  emailSent: { type: Boolean, default: false },

  // ── TTL Auto-Purge: notifications expire after 90 days ────────────────────────
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────────
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });  // MongoDB TTL

export default mongoose.model('Notification', notificationSchema);
