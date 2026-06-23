// server/services/amenityService.js — PropSync v2
// Amenity CRUD + booking management with conflict detection

import Amenity from '../models/amenityModel.js';
import AmenityBooking from '../models/amenityBookingModel.js';
import Property from '../models/propertyModel.js';
import mongoose from 'mongoose';

// ── Amenity CRUD ──────────────────────────────────────────────────────────────

export const listAmenities = async ({ propertyId, type, status, page = 1, limit = 20, ownerId = null } = {}) => {
  const filter = {};
  if (type)   filter.type = type;
  if (status) filter.status = status;

  if (propertyId) {
    filter.propertyId = new mongoose.Types.ObjectId(propertyId);
  } else if (ownerId) {
    const props = await Property.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }, '_id').lean();
    filter.propertyId = { $in: props.map(p => p._id) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [amenities, total] = await Promise.all([
    Amenity.find(filter)
      .populate('propertyId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Amenity.countDocuments(filter)
  ]);

  return { amenities, meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
};

export const getAmenityById = async (id) => {
  return Amenity.findById(id).populate('propertyId', 'name address ownerId').lean();
};

export const createAmenity = async (data) => {
  const property = await Property.findById(data.propertyId);
  if (!property) throw new Error('Property not found');

  const amenity = await Amenity.create(data);

  // Update denormalized count on property
  await Property.findByIdAndUpdate(data.propertyId, { $inc: { amenityCount: 1 } });

  return amenity.populate('propertyId', 'name address');
};

export const updateAmenity = async (id, updates) => {
  const allowed = ['name', 'description', 'type', 'capacity', 'bookingDurationMin',
    'bookingDurationMax', 'advanceBookingDays', 'requiresApproval',
    'operatingHours', 'status', 'images', 'rules'];
  const sanitized = {};
  allowed.forEach(k => { if (updates[k] !== undefined) sanitized[k] = updates[k]; });

  return Amenity.findByIdAndUpdate(id, { $set: sanitized }, { new: true, runValidators: true })
    .populate('propertyId', 'name address');
};

export const deleteAmenity = async (id) => {
  const amenity = await Amenity.findById(id);
  if (!amenity) return null;

  // Cancel any future bookings before deleting
  await AmenityBooking.updateMany(
    { amenityId: id, status: { $in: ['confirmed', 'pending_approval'] }, startTime: { $gt: new Date() } },
    { $set: { status: 'cancelled', cancellationReason: 'Amenity removed', cancelledAt: new Date() } }
  );

  await Amenity.findByIdAndDelete(id);
  await Property.findByIdAndUpdate(amenity.propertyId, { $inc: { amenityCount: -1 } });
  return amenity;
};

export const getAmenityStats = async (ownerId = null) => {
  let propertyFilter = {};
  if (ownerId) {
    const props = await Property.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }, '_id').lean();
    propertyFilter = { propertyId: { $in: props.map(p => p._id) } };
  }

  const [stats] = await Amenity.aggregate([
    { $match: propertyFilter },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
      under_maintenance: { $sum: { $cond: [{ $eq: ['$status', 'under_maintenance'] }, 1, 0] } }
    }}
  ]);

  return stats || { total: 0, active: 0, inactive: 0, under_maintenance: 0 };
};

// ── Booking Management ────────────────────────────────────────────────────────

export const listBookings = async ({
  tenantId = null, amenityId = null, propertyId = null,
  status = null, page = 1, limit = 20, ownerId = null
} = {}) => {
  const filter = {};
  if (tenantId)   filter.tenantId = new mongoose.Types.ObjectId(tenantId);
  if (amenityId)  filter.amenityId = new mongoose.Types.ObjectId(amenityId);
  if (status)     filter.status = status;

  if (propertyId) {
    filter.propertyId = new mongoose.Types.ObjectId(propertyId);
  } else if (ownerId) {
    const props = await Property.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }, '_id').lean();
    filter.propertyId = { $in: props.map(p => p._id) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [bookings, total] = await Promise.all([
    AmenityBooking.find(filter)
      .populate('amenityId', 'name type capacity')
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    AmenityBooking.countDocuments(filter)
  ]);

  return { bookings, meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
};

export const getBookingById = async (id) => {
  return AmenityBooking.findById(id)
    .populate('amenityId', 'name type capacity requiresApproval')
    .populate('tenantId', 'name email phone')
    .populate('propertyId', 'name')
    .lean();
};

export const createBooking = async (tenantId, data) => {
  const { amenityId, startTime, endTime, notes } = data;

  const amenity = await Amenity.findById(amenityId);
  if (!amenity) throw new Error('Amenity not found');
  if (amenity.status !== 'active') throw new Error('This amenity is not currently available for booking');

  // Duration validation
  const durationMins = (new Date(endTime) - new Date(startTime)) / 60000;
  if (durationMins < amenity.bookingDurationMin) {
    throw new Error(`Minimum booking duration is ${amenity.bookingDurationMin} minutes`);
  }
  if (durationMins > amenity.bookingDurationMax) {
    throw new Error(`Maximum booking duration is ${amenity.bookingDurationMax} minutes`);
  }

  // Advance booking check
  const hoursUntilStart = (new Date(startTime) - new Date()) / 3600000;
  const daysUntilStart = hoursUntilStart / 24;
  if (daysUntilStart > amenity.advanceBookingDays) {
    throw new Error(`Cannot book more than ${amenity.advanceBookingDays} days in advance`);
  }

  // Conflict check using model static
  const conflicts = await AmenityBooking.findConflicts(amenityId, new Date(startTime), new Date(endTime));
  if (conflicts.length > 0) {
    throw new Error('This time slot is already booked. Please choose a different time.');
  }

  const status = amenity.requiresApproval ? 'pending_approval' : 'confirmed';

  return AmenityBooking.create({
    amenityId,
    tenantId,
    propertyId: amenity.propertyId,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    notes: notes || '',
    status
  });
};

export const cancelBooking = async (bookingId, userId, isAdmin, reason = '') => {
  const booking = await AmenityBooking.findById(bookingId);
  if (!booking) return null;

  const isOwner = booking.tenantId.toString() === userId;
  if (!isAdmin && !isOwner) throw new Error('Not authorised to cancel this booking');

  if (['cancelled', 'completed'].includes(booking.status)) {
    throw new Error('Booking is already ' + booking.status);
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = userId;
  booking.cancellationReason = reason || 'Cancelled by user';
  await booking.save();
  return booking;
};

export const approveBooking = async (bookingId) => {
  return AmenityBooking.findByIdAndUpdate(
    bookingId,
    { $set: { status: 'confirmed' } },
    { new: true }
  );
};

export const addBookingFeedback = async (bookingId, tenantId, rating, feedback) => {
  const booking = await AmenityBooking.findOne({ _id: bookingId, tenantId });
  if (!booking) return null;
  if (!['completed', 'confirmed'].includes(booking.status)) {
    throw new Error('Can only rate completed bookings');
  }
  booking.rating = rating;
  booking.feedback = feedback || '';
  await booking.save();
  return booking;
};

export const getBookingStats = async (ownerId = null) => {
  let propertyFilter = {};
  if (ownerId) {
    const props = await Property.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }, '_id').lean();
    propertyFilter = { propertyId: { $in: props.map(p => p._id) } };
  }

  const [stats] = await AmenityBooking.aggregate([
    { $match: propertyFilter },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
      pending: { $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] } },
      cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
    }}
  ]);

  return stats || { total: 0, confirmed: 0, pending: 0, cancelled: 0, completed: 0 };
};
