// server/models/amenityBookingModel.js — PropSync v2
import mongoose from 'mongoose';

const amenityBookingSchema = new mongoose.Schema({
  // ── Reference Links ───────────────────────────────────────────────────────────
  amenityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Amenity',
    required: [true, 'Amenity ID is required']
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tenant ID is required']
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required']
  },

  // ── Booking Window ────────────────────────────────────────────────────────────
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },

  // ── Status State Machine ──────────────────────────────────────────────────────
  // confirmed (no approval needed) | pending_approval → confirmed | cancelled | completed
  status: {
    type: String,
    enum: ['pending_approval', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'confirmed'
  },
  cancellationReason: { type: String, default: null },
  cancelledAt: { type: Date, default: null },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── Check-In / Check-Out ──────────────────────────────────────────────────────
  checkInAt: { type: Date, default: null },
  checkOutAt: { type: Date, default: null },

  // ── Notes ─────────────────────────────────────────────────────────────────────
  notes: { type: String, default: '' },

  // ── Tenant Rating (post-use) ──────────────────────────────────────────────────
  rating: { type: Number, min: 1, max: 5, default: null },
  feedback: { type: String, default: null }

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────────
amenityBookingSchema.index({ amenityId: 1, startTime: 1 });
amenityBookingSchema.index({ amenityId: 1, endTime: 1 });
amenityBookingSchema.index({ tenantId: 1, status: 1 });
amenityBookingSchema.index({ propertyId: 1 });
amenityBookingSchema.index({ startTime: 1, endTime: 1 });

// ── Compound index to speed up conflict detection queries ─────────────────────
amenityBookingSchema.index(
  { amenityId: 1, status: 1, startTime: 1, endTime: 1 },
  { name: 'booking_conflict_check' }
);

// ── TTL index: auto-remove cancelled bookings after 90 days ───────────────────
amenityBookingSchema.index(
  { cancelledAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90, partialFilterExpression: { status: 'cancelled' } }
);

// ── Validation: endTime must be after startTime ────────────────────────────────
amenityBookingSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'End time must be after start time');
  }
  next();
});

// ── Static: find conflicting bookings ─────────────────────────────────────────
// Used by bookingService.js for conflict detection before creating a booking
amenityBookingSchema.statics.findConflicts = function (amenityId, startTime, endTime, excludeId = null) {
  const query = {
    amenityId,
    status: { $in: ['confirmed', 'pending_approval'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }  // overlap condition
    ]
  };
  if (excludeId) query._id = { $ne: excludeId };
  return this.find(query).lean();
};

export default mongoose.model('AmenityBooking', amenityBookingSchema);
