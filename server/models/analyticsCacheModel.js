import mongoose from 'mongoose';

const analyticsCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  ttl: { type: Number, default: 300 }, // seconds
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

analyticsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AnalyticsCache', analyticsCacheSchema);
