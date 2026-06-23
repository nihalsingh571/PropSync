// server/controllers/maintenanceController.js — PropSync v2
import * as maintenanceService from '../services/maintenanceService.js';
import Property from '../models/propertyModel.js';

const isAdmin = (user) => user?.roles?.includes('admin') || user?.isAdmin === true;
const isOwner = (user) => user?.roles?.includes('property_owner');
const isTenant = (user) => user?.roles?.includes('tenant');
const isStaff = (user) => user?.roles?.includes('maintenance_staff');

// ── Build scope filter for the calling user ────────────────────────────────────
const buildScope = async (user) => {
  if (isAdmin(user)) return {};                              // admin: no scope limit
  if (isTenant(user)) return { requesterId: user._id.toString() };
  if (isStaff(user))  return { assignedToId: user._id.toString() };
  if (isOwner(user)) {
    const props = await Property.find({ ownerId: user._id }, '_id').lean();
    return { ownerPropertyIds: props.map(p => p._id) };
  }
  return { requesterId: user._id.toString() }; // fallback
};

// ── GET /api/maintenance/stats ─────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const scope = await buildScope(req.user);
    const stats = await maintenanceService.getStats(scope);
    return res.json(stats);
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

// ── GET /api/maintenance/staff ─────────────────────────────────────────────────
export const getMaintenanceStaff = async (req, res) => {
  try {
    const staff = await maintenanceService.getMaintenanceStaff();
    return res.json(staff);
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

// ── GET /api/maintenance ───────────────────────────────────────────────────────
export const listRequests = async (req, res) => {
  try {
    const { status, priority, category, page, limit, search, propertyId } = req.query;
    const scope = await buildScope(req.user);
    const result = await maintenanceService.listRequests({
      ...scope, propertyId, status, priority, category,
      page: page || 1, limit: limit || 20, search: search || ''
    });
    return res.json(result);
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

// ── GET /api/maintenance/:id ───────────────────────────────────────────────────
export const getRequest = async (req, res) => {
  try {
    const request = await maintenanceService.getRequestById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Access control
    if (!isAdmin(req.user)) {
      const tid = request.tenantId?._id?.toString() ?? request.tenantId?.toString();
      const aid = request.assignedTo?._id?.toString() ?? request.assignedTo?.toString();
      const pid = request.propertyId?.ownerId?.toString();
      const uid = req.user._id.toString();

      const isOwnerOfProp = isOwner(req.user) && pid === uid;
      const isTenantOf = isTenant(req.user) && tid === uid;
      const isAssignedStaff = isStaff(req.user) && aid === uid;

      if (!isOwnerOfProp && !isTenantOf && !isAssignedStaff) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    return res.json(request);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    return res.status(500).json({ message: err.message });
  }
};

// ── POST /api/maintenance ──────────────────────────────────────────────────────
export const createRequest = async (req, res) => {
  try {
    const request = await maintenanceService.createRequest(req.user._id.toString(), req.body);
    return res.status(201).json({ message: 'Request submitted', request });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ message: err.message });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/maintenance/:id ───────────────────────────────────────────────────
export const updateRequest = async (req, res) => {
  try {
    const request = await maintenanceService.updateRequest(
      req.params.id, req.user._id.toString(), isAdmin(req.user), req.body
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    return res.json({ message: 'Request updated', request });
  } catch (err) {
    if (err.message.includes('authorised') || err.message.includes('open')) {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/maintenance/:id/status ─────────────────────────────────────────
export const transitionStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ message: 'New status is required' });

    const request = await maintenanceService.transitionStatus(
      req.params.id, req.user._id.toString(), status, note
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    return res.json({ message: `Status updated to ${status}`, request });
  } catch (err) {
    if (err.message.includes('Invalid transition')) return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/maintenance/:id/assign ─────────────────────────────────────────
export const assignStaff = async (req, res) => {
  try {
    const { staffUserId, note } = req.body;
    if (!staffUserId) return res.status(400).json({ message: 'staffUserId is required' });

    const request = await maintenanceService.assignStaff(
      req.params.id, staffUserId, req.user._id.toString(), note
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    return res.json({ message: 'Staff assigned', request });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('not maintenance')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/maintenance/:id/feedback ───────────────────────────────────────
export const addFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    const request = await maintenanceService.addFeedback(
      req.params.id, req.user._id.toString(), rating, feedback
    );
    if (!request) return res.status(404).json({ message: 'Request not found or not yours' });
    return res.json({ message: 'Feedback submitted', request });
  } catch (err) {
    if (err.message.includes('only rate')) return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/maintenance/:id ────────────────────────────────────────────────
export const deleteRequest = async (req, res) => {
  try {
    const request = await maintenanceService.deleteRequest(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    return res.json({ message: 'Request deleted' });
  } catch (err) { return res.status(500).json({ message: err.message }); }
};
