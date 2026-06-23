// server/models/userModel.js — PropSync v2
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // ── Core Identity ────────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false   // never return password by default
  },
  phone: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },

  // ── PropSync Role System ─────────────────────────────────────────────────────
  // Roles: admin | property_owner | tenant | maintenance_staff
  roles: {
    type: [String],
    enum: ['admin', 'property_owner', 'tenant', 'maintenance_staff'],
    default: ['tenant']
  },
  // isAdmin kept temporarily for backward-compat with existing JWT tokens
  // Will be removed after Phase 3 migration completes
  isAdmin: { type: Boolean, default: false },

  // ── Account Status ────────────────────────────────────────────────────────────
  lastActive: { type: Date, default: null },
  softDeleted: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },

  // ── Password Reset ────────────────────────────────────────────────────────────
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ softDeleted: 1, suspended: 1 });
userSchema.index({ lastActive: -1 });

// ── Hash password before saving ────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Methods ───────────────────────────────────────────────────────────

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.hasRole = function (role) {
  return this.roles?.includes(role) || (role === 'admin' && this.isAdmin);
};

userSchema.methods.isPropertyOwner = function () {
  return this.roles?.includes('property_owner');
};

userSchema.methods.isTenant = function () {
  return this.roles?.includes('tenant');
};

userSchema.methods.isMaintenanceStaff = function () {
  return this.roles?.includes('maintenance_staff');
};

export default mongoose.model('User', userSchema);
