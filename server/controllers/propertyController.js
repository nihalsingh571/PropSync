// server/controllers/propertyController.js — PropSync v2
import * as propertyService from '../services/propertyService.js';

// ── Helper ─────────────────────────────────────────────────────────────────────
const isAdminUser = (user) =>
  user?.roles?.includes('admin') || user?.isAdmin === true;

// ── GET /api/properties ────────────────────────────────────────────────────────
// Admin: all | Property Owner: only their own
export const listProperties = async (req, res) => {
  try {
    const { status, city, type, page, limit, search } = req.query;
    const admin = isAdminUser(req.user);

    const result = await propertyService.listProperties({
      ownerId: admin ? null : req.user._id.toString(),
      status,
      city,
      type,
      page: page || 1,
      limit: limit || 20,
      search: search || ''
    });

    return res.json(result);
  } catch (err) {
    console.error('listProperties error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/properties/stats ──────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const admin = isAdminUser(req.user);
    const stats = await propertyService.getPropertyStats(
      admin ? null : req.user._id.toString()
    );
    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/properties/:id ────────────────────────────────────────────────────
export const getProperty = async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Property owners can only view their own properties
    if (
      !isAdminUser(req.user) &&
      property.ownerId?._id?.toString() !== req.user._id.toString() &&
      property.ownerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorised to view this property' });
    }

    return res.json(property);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid property ID' });
    return res.status(500).json({ message: err.message });
  }
};

// ── POST /api/properties ───────────────────────────────────────────────────────
// Property Owner or Admin can create
export const createProperty = async (req, res) => {
  try {
    const ownerId = isAdminUser(req.user) && req.body.ownerId
      ? req.body.ownerId
      : req.user._id.toString();

    const property = await propertyService.createProperty(ownerId, req.body);
    return res.status(201).json({ message: 'Property created successfully', property });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/properties/:id ────────────────────────────────────────────────────
export const updateProperty = async (req, res) => {
  try {
    const property = await propertyService.updateProperty(
      req.params.id,
      req.user._id.toString(),
      isAdminUser(req.user),
      req.body
    );

    if (!property) return res.status(404).json({ message: 'Property not found or not authorised' });
    return res.json({ message: 'Property updated', property });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/properties/:id ─────────────────────────────────────────────────
export const deleteProperty = async (req, res) => {
  try {
    const property = await propertyService.deleteProperty(
      req.params.id,
      req.user._id.toString(),
      isAdminUser(req.user)
    );

    if (!property) return res.status(404).json({ message: 'Property not found or not authorised' });
    return res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    if (err.message.includes('active tenant')) return res.status(409).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── POST /api/properties/:id/units ─────────────────────────────────────────────
export const addUnit = async (req, res) => {
  try {
    const property = await propertyService.addUnit(
      req.params.id,
      req.user._id.toString(),
      isAdminUser(req.user),
      req.body
    );

    if (!property) return res.status(404).json({ message: 'Property not found or not authorised' });
    return res.status(201).json({ message: 'Unit added', property });
  } catch (err) {
    if (err.message.includes('already exists')) return res.status(409).json({ message: err.message });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/properties/:id/units/:unitId ──────────────────────────────────────
export const updateUnit = async (req, res) => {
  try {
    const property = await propertyService.updateUnit(
      req.params.id,
      req.params.unitId,
      req.user._id.toString(),
      isAdminUser(req.user),
      req.body
    );

    if (!property) return res.status(404).json({ message: 'Property or unit not found' });
    return res.json({ message: 'Unit updated', property });
  } catch (err) {
    if (err.message === 'Unit not found') return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/properties/:id/units/:unitId ───────────────────────────────────
export const deleteUnit = async (req, res) => {
  try {
    const property = await propertyService.deleteUnit(
      req.params.id,
      req.params.unitId,
      req.user._id.toString(),
      isAdminUser(req.user)
    );

    if (!property) return res.status(404).json({ message: 'Property or unit not found' });
    return res.json({ message: 'Unit removed', property });
  } catch (err) {
    if (err.message.includes('occupied')) return res.status(409).json({ message: err.message });
    if (err.message === 'Unit not found') return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};
