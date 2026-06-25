// server/services/propertyService.js — PropSync v2
// Business logic layer for property management.
// Controllers stay thin — all DB logic lives here.

import Property from '../models/propertyModel.js';
import Tenant from '../models/tenantModel.js';
import PropertyApplication from '../models/propertyApplicationModel.js';
import mongoose from 'mongoose';

// ── List Properties ────────────────────────────────────────────────────────────
// Admin: all properties | Owner: only their own
export const listProperties = async ({
  ownerId = null,        // filter to a specific owner (for property_owner role)
  status = null,
  city = null,
  type = null,
  page = 1,
  limit = 20,
  search = ''
} = {}) => {
  const filter = {};

  if (ownerId) filter.ownerId = new mongoose.Types.ObjectId(ownerId);
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (city) filter['address.city'] = { $regex: city, $options: 'i' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
      { 'address.street': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Property.countDocuments(filter)
  ]);

  // Compute occupancy rates on the fly
  const enriched = properties.map(p => ({
    ...p,
    occupiedUnits: p.units?.filter(u => u.status === 'occupied').length ?? 0,
    vacantUnits: p.units?.filter(u => u.status === 'vacant').length ?? 0,
    occupancyRate: p.units?.length
      ? Math.round((p.units.filter(u => u.status === 'occupied').length / p.units.length) * 100)
      : 0
  }));

  return {
    properties: enriched,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

// ── Get Single Property ─────────────────────────────────────────────────────────
export const getPropertyById = async (propertyId) => {
  const property = await Property.findById(propertyId)
    .populate('ownerId', 'name email phone')
    .populate('units.tenantId', 'name email phone')
    .lean();

  if (!property) return null;

  return {
    ...property,
    occupiedUnits: property.units?.filter(u => u.status === 'occupied').length ?? 0,
    vacantUnits: property.units?.filter(u => u.status === 'vacant').length ?? 0,
    occupancyRate: property.units?.length
      ? Math.round((property.units.filter(u => u.status === 'occupied').length / property.units.length) * 100)
      : 0
  };
};

// ── Create Property ────────────────────────────────────────────────────────────
export const createProperty = async (ownerId, data) => {
  const property = await Property.create({
    ...data,
    ownerId,
    totalUnits: data.units?.length ?? 1
  });

  return property.toObject();
};

// ── Update Property ────────────────────────────────────────────────────────────
export const updateProperty = async (propertyId, ownerId, isAdmin, updates) => {
  const filter = { _id: propertyId };
  // Property owners can only update their own properties
  if (!isAdmin) filter.ownerId = ownerId;

  const allowed = [
    'name', 'description', 'address', 'type',
    'yearBuilt', 'images', 'coverImage', 'status', 'totalUnits', 'furnishings'
  ];
  const sanitized = {};
  allowed.forEach(key => {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  });

  const property = await Property.findOneAndUpdate(
    filter,
    { $set: sanitized },
    { new: true, runValidators: true }
  ).populate('ownerId', 'name email');

  return property;
};

// ── Delete Property ────────────────────────────────────────────────────────────
export const deleteProperty = async (propertyId, ownerId, isAdmin) => {
  const filter = { _id: propertyId };
  if (!isAdmin) filter.ownerId = ownerId;

  // Check no active tenants first
  const activeTenants = await Tenant.countDocuments({
    propertyId,
    status: { $in: ['active', 'notice_period'] }
  });

  if (activeTenants > 0) {
    throw new Error(`Cannot delete property with ${activeTenants} active tenant(s). Vacate units first.`);
  }

  const property = await Property.findOneAndDelete(filter);
  return property;
};

// ── Add Unit ───────────────────────────────────────────────────────────────────
export const addUnit = async (propertyId, ownerId, isAdmin, unitData) => {
  const filter = { _id: propertyId };
  if (!isAdmin) filter.ownerId = ownerId;

  const property = await Property.findOne(filter);
  if (!property) return null;

  // Prevent duplicate unit numbers
  const exists = property.units.some(u =>
    u.unitNumber.toLowerCase() === unitData.unitNumber.toLowerCase()
  );
  if (exists) throw new Error(`Unit ${unitData.unitNumber} already exists in this property`);

  property.units.push(unitData);
  property.totalUnits = property.units.length;
  await property.save();

  return property;
};

// ── Update Unit ────────────────────────────────────────────────────────────────
export const updateUnit = async (propertyId, unitId, ownerId, isAdmin, unitData) => {
  const filter = { _id: propertyId };
  if (!isAdmin) filter.ownerId = ownerId;

  const property = await Property.findOne(filter);
  if (!property) return null;

  const unit = property.units.id(unitId);
  if (!unit) throw new Error('Unit not found');

  Object.assign(unit, unitData);
  await property.save();

  return property;
};

// ── Delete Unit ────────────────────────────────────────────────────────────────
export const deleteUnit = async (propertyId, unitId, ownerId, isAdmin) => {
  const filter = { _id: propertyId };
  if (!isAdmin) filter.ownerId = ownerId;

  const property = await Property.findOne(filter);
  if (!property) return null;

  const unit = property.units.id(unitId);
  if (!unit) throw new Error('Unit not found');
  if (unit.status === 'occupied') throw new Error('Cannot delete an occupied unit');

  unit.deleteOne();
  property.totalUnits = property.units.length;
  await property.save();

  return property;
};

// ── Get Property Stats (for dashboard) ────────────────────────────────────────
export const getPropertyStats = async (ownerId = null) => {
  const match = ownerId
    ? { ownerId: new mongoose.Types.ObjectId(ownerId) }
    : {};

  const [stats] = await Property.aggregate([
    { $match: match },
    { $unwind: { path: '$units', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        totalProperties: { $addToSet: '$_id' },
        totalUnits: { $sum: 1 },
        occupiedUnits: {
          $sum: { $cond: [{ $eq: ['$units.status', 'occupied'] }, 1, 0] }
        },
        vacantUnits: {
          $sum: { $cond: [{ $eq: ['$units.status', 'vacant'] }, 1, 0] }
        },
        totalMonthlyRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$units.status', 'occupied'] },
              '$units.monthlyRent',
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        totalProperties: { $size: '$totalProperties' },
        totalUnits: 1,
        occupiedUnits: 1,
        vacantUnits: 1,
        occupancyRate: {
          $cond: [
            { $gt: ['$totalUnits', 0] },
            {
              $round: [
                { $multiply: [{ $divide: ['$occupiedUnits', '$totalUnits'] }, 100] },
                1
              ]
            },
            0
          ]
        },
        totalMonthlyRevenue: 1
      }
    }
  ]);

  return stats || {
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    occupancyRate: 0,
    totalMonthlyRevenue: 0
  };
};

// ── Applications (Bookings) ────────────────────────────────────────────────────

export const applyForProperty = async (tenantId, propertyId, data) => {
  const property = await Property.findById(propertyId);
  if (!property) throw new Error('Property not found');
  if (property.status !== 'active') throw new Error('Property is not active');

  // Check if tenant already has a pending application for this property
  const existing = await PropertyApplication.findOne({ tenantId, propertyId, status: 'pending' });
  if (existing) throw new Error('You already have a pending application for this property');

  const application = new PropertyApplication({
    tenantId,
    propertyId,
    unitId: data.unitId || null,
    unitNumber: data.unitNumber || null,
    message: data.message || ''
  });

  await application.save();
  return application;
};

export const getApplications = async (ownerId = null) => {
  // If ownerId is provided, only fetch applications for properties they own
  let propertyIds = [];
  if (ownerId) {
    const properties = await Property.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }).select('_id');
    propertyIds = properties.map(p => p._id);
  }

  const filter = ownerId ? { propertyId: { $in: propertyIds } } : {};

  return PropertyApplication.find(filter)
    .populate('tenantId', 'name email phone')
    .populate('propertyId', 'name address')
    .sort({ createdAt: -1 })
    .lean();
};

export const updateApplicationStatus = async (applicationId, status, ownerId = null) => {
  const application = await PropertyApplication.findById(applicationId).populate('propertyId');
  if (!application) throw new Error('Application not found');

  if (ownerId && application.propertyId.ownerId.toString() !== ownerId.toString()) {
    throw new Error('Not authorised to update this application');
  }

  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status');
  }

  application.status = status;
  await application.save();

  return application;
};
