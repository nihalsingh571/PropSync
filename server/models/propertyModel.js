// server/models/propertyModel.js — PropSync v2
import mongoose from 'mongoose';

// ── Unit Sub-Schema (embedded, recommended for <50 units per property) ─────────
const unitSchema = new mongoose.Schema({
  unitNumber: { type: String, required: true, trim: true },
  floor: { type: Number, default: null },
  bedrooms: { type: Number, default: 1, min: 0 },
  bathrooms: { type: Number, default: 1, min: 0 },
  area: { type: Number, default: null },          // sq ft
  monthlyRent: { type: Number, required: true, min: 0 },
  depositAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['vacant', 'occupied', 'maintenance', 'reserved'],
    default: 'vacant'
  },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { _id: true, timestamps: false });

// ── Property Schema ────────────────────────────────────────────────────────────
const propertySchema = new mongoose.Schema({
  // ── Identity ─────────────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },

  // ── Ownership ─────────────────────────────────────────────────────────────────
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },

  // ── Address ───────────────────────────────────────────────────────────────────
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'India' }
  },

  // ── Property Details ──────────────────────────────────────────────────────────
  type: {
    type: String,
    enum: ['apartment', 'villa', 'commercial', 'co-living', 'independent_house'],
    default: 'apartment'
  },
  totalUnits: { type: Number, default: 1, min: 1 },
  yearBuilt: { type: Number, default: null },

  // ── Units (embedded) ──────────────────────────────────────────────────────────
  units: [unitSchema],

  // ── Amenities Reference ───────────────────────────────────────────────────────
  // Amenity documents reference this property via amenityId
  // This field is a denormalized count for quick display
  amenityCount: { type: Number, default: 0 },

  // ── Furnishings ───────────────────────────────────────────────────────────────
  furnishings: [{ type: String }],

  // ── Media ─────────────────────────────────────────────────────────────────────
  images: [{ type: String }],
  coverImage: { type: String, default: null },

  // ── Status ────────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_maintenance'],
    default: 'active'
  },

  // ── Computed Fields ───────────────────────────────────────────────────────────
  occupancyRate: { type: Number, default: 0, min: 0, max: 100 }

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────────
propertySchema.index({ ownerId: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ 'address.city': 1 });
propertySchema.index({ createdAt: -1 });

// ── Virtual: vacancy count ─────────────────────────────────────────────────────
propertySchema.virtual('vacantUnits').get(function () {
  return this.units.filter(u => u.status === 'vacant').length;
});

propertySchema.virtual('occupiedUnits').get(function () {
  return this.units.filter(u => u.status === 'occupied').length;
});

export default mongoose.model('Property', propertySchema);
