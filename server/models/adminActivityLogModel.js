import mongoose from 'mongoose';

const adminActivityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  payloadSnapshot: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  undoToken: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model('AdminActivityLog', adminActivityLogSchema);
