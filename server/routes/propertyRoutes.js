// server/routes/propertyRoutes.js — PropSync v2
import express from 'express';
import {
  listProperties,
  getStats,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  addUnit,
  updateUnit,
  deleteUnit
} from '../controllers/propertyController.js';
import { protect, admin, requireRole } from '../middleware/protect.js';
import { uploadMultiple } from '../middleware/upload.js';
import { uploadPropertyImages } from '../controllers/propertyController.js';

const router = express.Router();

// All property routes require authentication
router.use(protect);

// ── Stats ─────────────────────────────────────────────────────────────────────
// GET /api/properties/stats
// Admin sees platform-wide | Owner sees their own
router.get(
  '/stats',
  requireRole('property_owner', 'admin'),
  getStats
);

// ── Property CRUD ─────────────────────────────────────────────────────────────

// GET /api/properties
router.get(
  '/',
  requireRole('property_owner', 'admin'),
  listProperties
);

// POST /api/properties
router.post(
  '/',
  requireRole('property_owner', 'admin'),
  createProperty
);

// GET /api/properties/:id
// Accessible by: admin, property_owner (own), tenant (their leased property)
router.get(
  '/:id',
  requireRole('property_owner', 'tenant', 'maintenance_staff', 'admin'),
  getProperty
);

// PUT /api/properties/:id
router.put(
  '/:id',
  requireRole('property_owner', 'admin'),
  updateProperty
);

// DELETE /api/properties/:id  (Admin only — prevents accidental deletion)
router.delete(
  '/:id',
  admin,
  deleteProperty
);

// POST /api/properties/:id/images — upload up to 5 images
router.post(
  '/:id/images',
  requireRole('property_owner', 'admin'),
  uploadMultiple,
  uploadPropertyImages
);

// ── Unit Sub-Document Routes ───────────────────────────────────────────────────

// POST /api/properties/:id/units
router.post(
  '/:id/units',
  requireRole('property_owner', 'admin'),
  addUnit
);

// PUT /api/properties/:id/units/:unitId
router.put(
  '/:id/units/:unitId',
  requireRole('property_owner', 'admin'),
  updateUnit
);

// DELETE /api/properties/:id/units/:unitId
router.delete(
  '/:id/units/:unitId',
  requireRole('property_owner', 'admin'),
  deleteUnit
);

export default router;
