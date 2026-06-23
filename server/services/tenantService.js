// server/services/tenantService.js — PropSync v2
// Business logic for tenant profile management.
// Handles creation, onboarding, lease tracking, and status transitions.

import Tenant from '../models/tenantModel.js';
import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

// ── List Tenants ───────────────────────────────────────────────────────────────
// Admin: all tenants | Owner: only tenants in their properties
export const listTenants = async ({
  ownerId = null,
  propertyId = null,
  status = null,
  page = 1,
  limit = 20,
  search = ''
} = {}) => {
  const filter = {};

  if (status) filter.status = status;
  if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);

  // If scoped to an owner, find only properties they own first
  if (ownerId) {
    const ownerProperties = await Property.find(
      { ownerId: new mongoose.Types.ObjectId(ownerId) },
      '_id'
    ).lean();
    const propertyIds = ownerProperties.map(p => p._id);
    filter.propertyId = { $in: propertyIds };
  }

  const skip = (Number(page) - 1) * Number(limit);

  let query = Tenant.find(filter)
    .populate('userId', 'name email phone')
    .populate('propertyId', 'name address ownerId');

  if (search) {
    // After populate, we need to handle search in aggregation or post-filter
    // Using a lean query + post-filter for simplicity (tenant count is typically small)
    const all = await Tenant.find(filter)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'name address')
      .lean();

    const lower = search.toLowerCase();
    const filtered = all.filter(t =>
      t.userId?.name?.toLowerCase().includes(lower) ||
      t.userId?.email?.toLowerCase().includes(lower) ||
      t.propertyId?.name?.toLowerCase().includes(lower) ||
      t.unitNumber?.toLowerCase().includes(lower)
    );

    const paginated = filtered.slice(skip, skip + Number(limit));
    return {
      tenants: paginated,
      meta: { page: Number(page), limit: Number(limit), total: filtered.length, totalPages: Math.ceil(filtered.length / Number(limit)) }
    };
  }

  const [tenants, total] = await Promise.all([
    query.sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Tenant.countDocuments(filter)
  ]);

  return {
    tenants,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
  };
};

// ── Get Single Tenant ──────────────────────────────────────────────────────────
export const getTenantById = async (tenantId) => {
  return Tenant.findById(tenantId)
    .populate('userId', 'name email phone')
    .populate('propertyId', 'name address ownerId')
    .lean();
};

// ── Get Tenant by User ID (own profile) ───────────────────────────────────────
export const getTenantByUserId = async (userId) => {
  return Tenant.findOne({ userId })
    .populate('propertyId', 'name address ownerId')
    .lean();
};

// ── Create Tenant ──────────────────────────────────────────────────────────────
// Creates a Tenant record and marks the corresponding unit as 'occupied'
export const createTenant = async (data) => {
  const { userId, propertyId, unitNumber, leaseStart, leaseEnd, monthlyRent, depositPaid, rentDueDay, emergencyContact, notes } = data;

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Verify property + unit exist
  const property = await Property.findById(propertyId);
  if (!property) throw new Error('Property not found');

  const unit = property.units.find(u => u.unitNumber === unitNumber);
  if (!unit) throw new Error(`Unit ${unitNumber} not found in property`);
  if (unit.status === 'occupied') throw new Error(`Unit ${unitNumber} is already occupied`);

  // Check for existing active tenant record for this user
  const existing = await Tenant.findOne({ userId });
  if (existing) throw new Error('This user already has a tenant profile. Update existing record instead.');

  // Create tenant record
  const tenant = await Tenant.create({
    userId, propertyId, unitNumber, leaseStart, leaseEnd,
    monthlyRent, depositPaid: depositPaid || 0,
    rentDueDay: rentDueDay || 1,
    emergencyContact: emergencyContact || {},
    notes: notes || '',
    status: 'active'
  });

  // Mark unit as occupied
  unit.status = 'occupied';
  unit.tenantId = userId;
  await property.save();

  return tenant.populate(['userId', 'propertyId']);
};

// ── Update Tenant ──────────────────────────────────────────────────────────────
export const updateTenant = async (tenantId, updates, isAdmin = false) => {
  const allowed = [
    'leaseEnd', 'monthlyRent', 'depositPaid', 'rentDueDay',
    'status', 'emergencyContact', 'notes'
  ];
  // Admin can also change property/unit assignment
  if (isAdmin) allowed.push('propertyId', 'unitNumber');

  const sanitized = {};
  allowed.forEach(k => { if (updates[k] !== undefined) sanitized[k] = updates[k]; });

  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    { $set: sanitized },
    { new: true, runValidators: true }
  ).populate('userId', 'name email phone').populate('propertyId', 'name address');

  // If status changed to 'vacated', free the unit
  if (sanitized.status === 'vacated' && tenant) {
    const property = await Property.findById(tenant.propertyId);
    if (property) {
      const unit = property.units.find(u => u.unitNumber === tenant.unitNumber);
      if (unit) {
        unit.status = 'vacant';
        unit.tenantId = null;
        await property.save();
      }
    }
  }

  return tenant;
};

// ── Delete Tenant Record ───────────────────────────────────────────────────────
export const deleteTenant = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) return null;

  if (tenant.status === 'active') {
    throw new Error('Cannot delete an active tenant. Update status to "vacated" first.');
  }

  // Free the unit if still marked as occupied
  const property = await Property.findById(tenant.propertyId);
  if (property) {
    const unit = property.units.find(u => u.unitNumber === tenant.unitNumber);
    if (unit && unit.status === 'occupied') {
      unit.status = 'vacant';
      unit.tenantId = null;
      await property.save();
    }
  }

  await Tenant.findByIdAndDelete(tenantId);
  return tenant;
};

// ── Tenant Stats (for dashboard) ───────────────────────────────────────────────
export const getTenantStats = async (ownerId = null) => {
  let propertyFilter = {};
  if (ownerId) {
    const props = await Property.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }, '_id').lean();
    propertyFilter = { propertyId: { $in: props.map(p => p._id) } };
  }

  const [stats] = await Tenant.aggregate([
    { $match: propertyFilter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        notice_period: { $sum: { $cond: [{ $eq: ['$status', 'notice_period'] }, 1, 0] } },
        vacated: { $sum: { $cond: [{ $eq: ['$status', 'vacated'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending_verification'] }, 1, 0] } }
      }
    }
  ]);

  return stats
    ? { total: stats.total, active: stats.active, notice_period: stats.notice_period, vacated: stats.vacated, pending: stats.pending }
    : { total: 0, active: 0, notice_period: 0, vacated: 0, pending: 0 };
};

// ── Leases Expiring Soon ───────────────────────────────────────────────────────
export const getExpiringLeases = async (ownerId = null, days = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  let propertyFilter = {};
  if (ownerId) {
    const props = await Property.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }, '_id').lean();
    propertyFilter = { propertyId: { $in: props.map(p => p._id) } };
  }

  return Tenant.find({
    ...propertyFilter,
    status: 'active',
    leaseEnd: { $gte: new Date(), $lte: cutoff }
  })
    .populate('userId', 'name email phone')
    .populate('propertyId', 'name address')
    .sort({ leaseEnd: 1 })
    .lean();
};
