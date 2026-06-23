// server/controllers/amenityController.js — PropSync v2
import * as amenityService from '../services/amenityService.js';
import Property from '../models/propertyModel.js';

const isAdmin = u => u?.roles?.includes('admin') || u?.isAdmin === true;
const isOwner = u => u?.roles?.includes('property_owner');
const isTenant = u => u?.roles?.includes('tenant');

// ── Scope helper ───────────────────────────────────────────────────────────────
const ownerScope = async (user) => {
  if (isAdmin(user)) return {};
  if (isOwner(user)) return { ownerId: user._id.toString() };
  return {};
};

// ════════════════════════════════════════════════════════════════
// AMENITY ENDPOINTS
// ════════════════════════════════════════════════════════════════

// GET /api/amenities/stats
export const getAmenityStats = async (req, res) => {
  try {
    const scope = await ownerScope(req.user);
    const stats = await amenityService.getAmenityStats(scope.ownerId || null);
    return res.json(stats);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// GET /api/amenities
export const listAmenities = async (req, res) => {
  try {
    const { propertyId, type, status, page, limit } = req.query;
    const scope = await ownerScope(req.user);
    const result = await amenityService.listAmenities({
      propertyId, type, status,
      page: page || 1, limit: limit || 20,
      ownerId: scope.ownerId || null
    });
    return res.json(result);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// GET /api/amenities/:id
export const getAmenity = async (req, res) => {
  try {
    const amenity = await amenityService.getAmenityById(req.params.id);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    return res.json(amenity);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// POST /api/amenities
export const createAmenity = async (req, res) => {
  try {
    // Owners may only create amenities for their own properties
    if (!isAdmin(req.user) && isOwner(req.user)) {
      const property = await Property.findById(req.body.propertyId);
      if (!property) return res.status(404).json({ message: 'Property not found' });
      if (property.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You do not own this property' });
      }
    }
    const amenity = await amenityService.createAmenity(req.body);
    return res.status(201).json({ message: 'Amenity created', amenity });
  } catch (e) {
    if (e.message.includes('not found')) return res.status(404).json({ message: e.message });
    if (e.name === 'ValidationError') return res.status(400).json({ message: e.message });
    return res.status(500).json({ message: e.message });
  }
};

// PUT /api/amenities/:id
export const updateAmenity = async (req, res) => {
  try {
    const amenity = await amenityService.updateAmenity(req.params.id, req.body);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    return res.json({ message: 'Amenity updated', amenity });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// DELETE /api/amenities/:id
export const deleteAmenity = async (req, res) => {
  try {
    const amenity = await amenityService.deleteAmenity(req.params.id);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    return res.json({ message: 'Amenity deleted and future bookings cancelled' });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ════════════════════════════════════════════════════════════════
// BOOKING ENDPOINTS
// ════════════════════════════════════════════════════════════════

// GET /api/amenities/bookings/stats
export const getBookingStats = async (req, res) => {
  try {
    const scope = await ownerScope(req.user);
    const stats = await amenityService.getBookingStats(scope.ownerId || null);
    return res.json(stats);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// GET /api/amenities/:id/bookings
export const listBookings = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const scope = await ownerScope(req.user);
    const result = await amenityService.listBookings({
      amenityId: req.params.id,
      tenantId: isTenant(req.user) && !isAdmin(req.user) ? req.user._id.toString() : null,
      status, page: page || 1, limit: limit || 20,
      ownerId: scope.ownerId || null
    });
    return res.json(result);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// GET /api/amenities/my-bookings
export const myBookings = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await amenityService.listBookings({
      tenantId: req.user._id.toString(),
      status, page: page || 1, limit: limit || 20
    });
    return res.json(result);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// POST /api/amenities/:id/book
export const createBooking = async (req, res) => {
  try {
    const booking = await amenityService.createBooking(req.user._id.toString(), {
      amenityId: req.params.id,
      ...req.body
    });
    return res.status(201).json({ message: 'Booking created', booking });
  } catch (e) {
    if (e.message.includes('already booked') || e.message.includes('not available')) {
      return res.status(409).json({ message: e.message });
    }
    if (e.message.includes('duration') || e.message.includes('advance')) {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: e.message });
  }
};

// PATCH /api/amenities/bookings/:bookingId/cancel
export const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await amenityService.cancelBooking(
      req.params.bookingId, req.user._id.toString(), isAdmin(req.user), reason
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    return res.json({ message: 'Booking cancelled', booking });
  } catch (e) {
    if (e.message.includes('authorised') || e.message.includes('already')) {
      return res.status(403).json({ message: e.message });
    }
    return res.status(500).json({ message: e.message });
  }
};

// PATCH /api/amenities/bookings/:bookingId/approve
export const approveBooking = async (req, res) => {
  try {
    const booking = await amenityService.approveBooking(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    return res.json({ message: 'Booking approved', booking });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// PATCH /api/amenities/bookings/:bookingId/feedback
export const addBookingFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    const booking = await amenityService.addBookingFeedback(
      req.params.bookingId, req.user._id.toString(), rating, feedback
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found or not yours' });
    return res.json({ message: 'Feedback submitted', booking });
  } catch (e) {
    if (e.message.includes('only rate')) return res.status(400).json({ message: e.message });
    return res.status(500).json({ message: e.message });
  }
};
