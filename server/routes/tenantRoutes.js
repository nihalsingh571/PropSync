// server/routes/tenantRoutes.js — PropSync v2
import express from 'express';
import {
  listTenants,
  getStats,
  getExpiringLeases,
  getMyProfile,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant
} from '../controllers/tenantController.js';
import { protect, admin, requireRole } from '../middleware/protect.js';

const router = express.Router();

// All tenant routes require authentication
router.use(protect);

// ── Stats & Utility ────────────────────────────────────────────────────────────
router.get('/stats',    requireRole('property_owner', 'admin'), getStats);
router.get('/expiring', requireRole('property_owner', 'admin'), getExpiringLeases);

// ── Own Tenant Profile (for Tenant role) ─────────────────────────────────────
router.get('/me', requireRole('tenant'), getMyProfile);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router.get('/',    requireRole('property_owner', 'admin'), listTenants);
router.post('/',   requireRole('property_owner', 'admin'), createTenant);

router.get('/:id',    requireRole('tenant', 'property_owner', 'admin'), getTenant);
router.put('/:id',    requireRole('property_owner', 'admin'), updateTenant);
router.delete('/:id', admin, deleteTenant);          // Admin-only hard delete

export default router;
