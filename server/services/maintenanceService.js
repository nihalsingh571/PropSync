// server/services/maintenanceService.js — PropSync v2
// State machine for maintenance requests.
// Flow: open → assigned → in_progress → pending_review → resolved → closed

import MaintenanceRequest from '../models/maintenanceRequestModel.js';
import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

// ── Valid state transitions ────────────────────────────────────────────────────
const TRANSITIONS = {
  open:           ['assigned', 'closed'],
  assigned:       ['in_progress', 'open', 'closed'],
  in_progress:    ['pending_review', 'assigned'],
  pending_review: ['resolved', 'in_progress'],
  resolved:       ['closed'],
  closed:         []   // terminal state
};

const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;

// ── List Requests ──────────────────────────────────────────────────────────────
export const listRequests = async ({
  requesterId = null,    // tenant: own requests only
  assignedToId = null,   // maintenance_staff: assigned to them
  ownerPropertyIds = null, // property_owner: their properties
  propertyId = null,
  status = null,
  priority = null,
  category = null,
  page = 1,
  limit = 20,
  search = ''
} = {}) => {
  const filter = {};

  if (requesterId)  filter.tenantId = new mongoose.Types.ObjectId(requesterId);
  if (assignedToId) filter.assignedTo = new mongoose.Types.ObjectId(assignedToId);
  if (ownerPropertyIds) filter.propertyId = { $in: ownerPropertyIds };
  if (propertyId)   filter.propertyId = new mongoose.Types.ObjectId(propertyId);
  if (status)       filter.status = status;
  if (priority)     filter.priority = priority;
  if (category)     filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { unitNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [requests, total] = await Promise.all([
    MaintenanceRequest.find(filter)
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name address')
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    MaintenanceRequest.countDocuments(filter)
  ]);

  return { requests, meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
};

// ── Get Single Request ─────────────────────────────────────────────────────────
export const getRequestById = async (id) => {
  return MaintenanceRequest.findById(id)
    .populate('tenantId', 'name email phone')
    .populate('propertyId', 'name address ownerId')
    .populate('assignedTo', 'name email phone')
    .populate('timeline.changedBy', 'name email')
    .lean();
};

// ── Create Request (Tenant or Admin) ──────────────────────────────────────────
export const createRequest = async (requesterId, data) => {
  const { propertyId, unitNumber, title, description, category, priority, attachments } = data;

  // Validate property exists
  const property = await Property.findById(propertyId);
  if (!property) throw new Error('Property not found');

  const request = await MaintenanceRequest.create({
    tenantId: requesterId,
    propertyId,
    unitNumber,
    title,
    description,
    category: category || 'other',
    priority: priority || 'medium',
    attachments: attachments || [],
    status: 'open',
    timeline: [{
      status: 'open',
      note: 'Request submitted',
      changedBy: requesterId,
      changedAt: new Date()
    }]
  });

  return request
    .populate('tenantId', 'name email')
    .then(r => r.populate('propertyId', 'name address'));
};

// ── Update Basic Fields (title, description, category, priority) ──────────────
export const updateRequest = async (id, requesterId, isAdmin, updates) => {
  const request = await MaintenanceRequest.findById(id);
  if (!request) return null;

  // Tenants can only edit their own open requests
  if (!isAdmin && request.tenantId.toString() !== requesterId) {
    throw new Error('Not authorised to update this request');
  }
  if (!isAdmin && request.status !== 'open') {
    throw new Error('Can only edit requests that are still open');
  }

  const allowed = ['title', 'description', 'category', 'priority'];
  allowed.forEach(k => { if (updates[k] !== undefined) request[k] = updates[k]; });

  await request.save();
  return request.populate(['tenantId', 'propertyId', 'assignedTo']);
};

// ── Transition Status (State Machine) ─────────────────────────────────────────
export const transitionStatus = async (id, actorId, newStatus, note = '') => {
  const request = await MaintenanceRequest.findById(id);
  if (!request) return null;

  if (!canTransition(request.status, newStatus)) {
    throw new Error(`Invalid transition: ${request.status} → ${newStatus}`);
  }

  const prev = request.status;
  request.status = newStatus;

  // Auto-set resolution fields
  if (newStatus === 'resolved' && !request.resolvedAt) request.resolvedAt = new Date();

  // Append timeline entry
  request.timeline.push({
    status: newStatus,
    note: note || `Status changed from ${prev} to ${newStatus}`,
    changedBy: actorId,
    changedAt: new Date()
  });

  await request.save();
  return request
    .populate('tenantId', 'name email')
    .then(r => r.populate('propertyId', 'name address'))
    .then(r => r.populate('assignedTo', 'name email'))
    .then(r => r.populate('timeline.changedBy', 'name'));
};

// ── Assign Staff ───────────────────────────────────────────────────────────────
export const assignStaff = async (id, staffUserId, actorId, note = '') => {
  const request = await MaintenanceRequest.findById(id);
  if (!request) return null;

  // Verify the user is actually maintenance_staff
  const staff = await User.findById(staffUserId);
  if (!staff) throw new Error('Staff user not found');
  if (!staff.roles?.includes('maintenance_staff') && !staff.roles?.includes('admin')) {
    throw new Error('User is not maintenance staff');
  }

  request.assignedTo = staffUserId;
  request.assignedAt = new Date();

  if (request.status === 'open') {
    request.status = 'assigned';
    request.timeline.push({
      status: 'assigned',
      note: note || `Assigned to ${staff.name}`,
      changedBy: actorId,
      changedAt: new Date()
    });
  }

  await request.save();
  return request
    .populate('tenantId', 'name email')
    .then(r => r.populate('propertyId', 'name address'))
    .then(r => r.populate('assignedTo', 'name email phone'));
};

// ── Add Tenant Rating / Feedback ───────────────────────────────────────────────
export const addFeedback = async (id, tenantId, rating, feedback) => {
  const request = await MaintenanceRequest.findOne({ _id: id, tenantId });
  if (!request) return null;
  if (!['resolved', 'closed'].includes(request.status)) {
    throw new Error('Can only rate resolved or closed requests');
  }

  request.tenantRating = rating;
  request.tenantFeedback = feedback || '';
  await request.save();
  return request;
};

// ── Delete Request ─────────────────────────────────────────────────────────────
export const deleteRequest = async (id) => {
  return MaintenanceRequest.findByIdAndDelete(id);
};

// ── Stats ──────────────────────────────────────────────────────────────────────
export const getStats = async ({ requesterId = null, assignedToId = null, ownerPropertyIds = null } = {}) => {
  const match = {};
  if (requesterId)  match.tenantId = new mongoose.Types.ObjectId(requesterId);
  if (assignedToId) match.assignedTo = new mongoose.Types.ObjectId(assignedToId);
  if (ownerPropertyIds) match.propertyId = { $in: ownerPropertyIds };

  const [stats] = await MaintenanceRequest.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total:          { $sum: 1 },
        open:           { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        assigned:       { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
        in_progress:    { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        pending_review: { $sum: { $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0] } },
        resolved:       { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed:         { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        urgent:         { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
        high:           { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
      }
    }
  ]);

  return stats || { total: 0, open: 0, assigned: 0, in_progress: 0, pending_review: 0, resolved: 0, closed: 0, urgent: 0, high: 0 };
};

// ── Get maintenance staff users (for assign dropdown) ─────────────────────────
export const getMaintenanceStaff = async () => {
  return User.find({ roles: 'maintenance_staff', suspended: { $ne: true } })
    .select('name email phone')
    .lean();
};

// ── Add Photo Attachments ──────────────────────────────────────────────────────
export const addAttachments = async (id, newAttachments) => {
  return MaintenanceRequest.findByIdAndUpdate(
    id,
    { $push: { attachments: { $each: newAttachments } } },
    { new: true }
  );
};
