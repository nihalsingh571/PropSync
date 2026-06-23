// server/models/tenantModel.js — PropSync v2
import mongoose from 'mongoose';

// ── Document Sub-Schema ────────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },    // e.g. "Aadhar Card", "Lease Agreement"
  type: {
    type: String,
    enum: ['id_proof', 'lease', 'income_proof', 'other'],
    default: 'other'
  },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

// ── Tenant Schema ──────────────────────────────────────────────────────────────
const tenantSchema = new mongoose.Schema({
  // ── Links ─────────────────────────────────────────────────────────────────────
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true      // one tenant profile per user account
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required']
  },
  unitNumber: {
    type: String,
    required: [true, 'Unit number is required'],
    trim: true
  },

  // ── Lease Details ─────────────────────────────────────────────────────────────
  leaseStart: { type: Date, required: true },
  leaseEnd: { type: Date, required: true },
  monthlyRent: { type: Number, required: true, min: 0 },
  depositPaid: { type: Number, default: 0 },
  rentDueDay: { type: Number, default: 1, min: 1, max: 28 }, // day of month

  // ── Status ────────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['active', 'notice_period', 'vacated', 'pending_verification'],
    default: 'pending_verification'
  },

  // ── Emergency Contact ─────────────────────────────────────────────────────────
  emergencyContact: {
    name: { type: String, default: null },
    phone: { type: String, default: null },
    relation: { type: String, default: null }
  },

  // ── Documents ─────────────────────────────────────────────────────────────────
  documents: [documentSchema],

  // ── Notes ─────────────────────────────────────────────────────────────────────
  notes: { type: String, default: '' }

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────────
tenantSchema.index({ userId: 1 });
tenantSchema.index({ propertyId: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ propertyId: 1, unitNumber: 1 });

// ── Validation: leaseEnd must be after leaseStart ──────────────────────────────
tenantSchema.pre('validate', function (next) {
  if (this.leaseStart && this.leaseEnd && this.leaseEnd <= this.leaseStart) {
    this.invalidate('leaseEnd', 'Lease end date must be after lease start date');
  }
  next();
});

export default mongoose.model('Tenant', tenantSchema);
