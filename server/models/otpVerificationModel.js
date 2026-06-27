import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

// TTL index: delete verification documents automatically after expiresAt is reached
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpVerification', otpVerificationSchema);
