// server/models/maintenanceRequestModel.js — PropSync v2
import mongoose from 'mongoose';

// ── Timeline Event Sub-Schema ──────────────────────────────────────────────────
// Each status change is recorded in the timeline for full audit trail
const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'pending_review', 'resolved', 'closed'],
    required: true
  },
  note: { type: String, default: '' },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now }
}, { _id: true });

// ── Attachment Sub-Schema ──────────────────────────────────────────────────────
const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, default: 'image/jpeg' }
}, { _id: false });

// ── Maintenance Request Schema ─────────────────────────────────────────────────
const maintenanceRequestSchema = new mongoose.Schema({
  // ── Reference Links ───────────────────────────────────────────────────────────
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
  unitNumber: { type: String, required: true },

  // ── Request Details ───────────────────────────────────────────────────────────
  title: {
    type: String,
    required: [true, 'Request title is required'],
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  category: {
    type: String,
    enum: [
      'plumbing',
      'electrical',
      'hvac',        // heating/cooling/ventilation
      'appliance',
      'structural',
      'pest_control',
      'cleaning',
      'security',
      'internet',
      'other'
    ],
    required: true,
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  attachments: [attachmentSchema],

  // ── Assignment ────────────────────────────────────────────────────────────────
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: { type: Date, default: null },

  // ── Status State Machine ──────────────────────────────────────────────────────
  // Flow: open → assigned → in_progress → pending_review → resolved → closed
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'pending_review', 'resolved', 'closed'],
    default: 'open'
  },

  // ── Timeline ──────────────────────────────────────────────────────────────────
  timeline: [timelineEventSchema],

  // ── Resolution ────────────────────────────────────────────────────────────────
  resolvedAt: { type: Date, default: null },
  resolutionNote: { type: String, default: null },

  // ── Tenant Feedback ───────────────────────────────────────────────────────────
  tenantRating: { type: Number, min: 1, max: 5, default: null },
  tenantFeedback: { type: String, default: null }

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────────
maintenanceRequestSchema.index({ propertyId: 1, status: 1 });
maintenanceRequestSchema.index({ tenantId: 1 });
maintenanceRequestSchema.index({ assignedTo: 1, status: 1 });
maintenanceRequestSchema.index({ priority: 1, status: 1 });
maintenanceRequestSchema.index({ createdAt: -1 });

// ── Virtuals ───────────────────────────────────────────────────────────────────
maintenanceRequestSchema.virtual('resolutionTime').get(function () {
  if (!this.resolvedAt) return null;
  return Math.round((this.resolvedAt - this.createdAt) / (1000 * 60 * 60)); // hours
});

// ── Middleware: auto-set resolvedAt on status change to resolved ───────────────
maintenanceRequestSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  if (this.isModified('status') && this.status === 'assigned' && !this.assignedAt) {
    this.assignedAt = new Date();
  }
  next();
});

export default mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
