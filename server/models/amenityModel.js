// server/models/amenityModel.js — PropSync v2
import mongoose from 'mongoose';

// ── Operating Hours Sub-Schema ─────────────────────────────────────────────────
const operatingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  open: { type: String, default: '08:00' },   // HH:MM 24h format
  close: { type: String, default: '22:00' },
  isClosed: { type: Boolean, default: false }
}, { _id: false });

// ── Amenity Schema ─────────────────────────────────────────────────────────────
const amenitySchema = new mongoose.Schema({
  // ── Identity ─────────────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Amenity name is required'],
    trim: true
  },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: [
      'gym',
      'swimming_pool',
      'meeting_room',
      'rooftop',
      'clubhouse',
      'playground',
      'parking',
      'laundry',
      'bbq_area',
      'game_room',
      'other'
    ],
    required: true,
    default: 'other'
  },

  // ── Property Link ─────────────────────────────────────────────────────────────
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required']
  },

  // ── Capacity & Booking ────────────────────────────────────────────────────────
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1'],
    default: 10
  },
  bookingDurationMin: { type: Number, default: 30 },   // minimum booking in minutes
  bookingDurationMax: { type: Number, default: 120 },  // maximum booking in minutes
  advanceBookingDays: { type: Number, default: 7 },    // how far ahead can tenants book
  requiresApproval: { type: Boolean, default: false },

  // ── Operating Hours ───────────────────────────────────────────────────────────
  operatingHours: [operatingHoursSchema],

  // ── Status ────────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_maintenance'],
    default: 'active'
  },

  // ── Media ─────────────────────────────────────────────────────────────────────
  images: [{ type: String }],

  // ── Rules ────────────────────────────────────────────────────────────────────
  rules: [{ type: String }]   // e.g. ["No food allowed", "Booking 24hrs in advance"]

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────────
amenitySchema.index({ propertyId: 1 });
amenitySchema.index({ propertyId: 1, status: 1 });
amenitySchema.index({ type: 1 });

export default mongoose.model('Amenity', amenitySchema);
