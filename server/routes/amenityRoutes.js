// server/routes/amenityRoutes.js — PropSync v2
import express from 'express';
import {
  getAmenityStats,
  listAmenities,
  getAmenity,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  getBookingStats,
  listBookings,
  myBookings,
  createBooking,
  cancelBooking,
  approveBooking,
  addBookingFeedback
} from '../controllers/amenityController.js';
import { protect, admin, requireRole } from '../middleware/protect.js';

const router = express.Router();
router.use(protect);

// ── Amenity Stats ──────────────────────────────────────────────────────────────
router.get('/stats',          requireRole('property_owner', 'admin'), getAmenityStats);

// ── Booking Stats ──────────────────────────────────────────────────────────────
router.get('/bookings/stats', requireRole('property_owner', 'admin'), getBookingStats);

// ── My Bookings (tenant) ───────────────────────────────────────────────────────
router.get('/my-bookings',    requireRole('tenant'), myBookings);

// ── Amenity CRUD ───────────────────────────────────────────────────────────────
router.get('/',    requireRole('tenant', 'property_owner', 'admin'), listAmenities);
router.post('/',   requireRole('property_owner', 'admin'), createAmenity);

router.get('/:id',    requireRole('tenant', 'property_owner', 'admin'), getAmenity);
router.put('/:id',    requireRole('property_owner', 'admin'), updateAmenity);
router.delete('/:id', admin, deleteAmenity);

// ── Per-Amenity Bookings ───────────────────────────────────────────────────────
router.get('/:id/bookings',  requireRole('tenant', 'property_owner', 'admin'), listBookings);
router.post('/:id/book',     requireRole('tenant'), createBooking);

// ── Booking Actions ────────────────────────────────────────────────────────────
router.patch('/bookings/:bookingId/cancel',   requireRole('tenant', 'property_owner', 'admin'), cancelBooking);
router.patch('/bookings/:bookingId/approve',  requireRole('property_owner', 'admin'), approveBooking);
router.patch('/bookings/:bookingId/feedback', requireRole('tenant'), addBookingFeedback);

export default router;
