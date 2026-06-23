// server/routes/maintenanceRoutes.js — PropSync v2
import express from 'express';
import {
  getStats,
  getMaintenanceStaff,
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  transitionStatus,
  assignStaff,
  addFeedback,
  deleteRequest
} from '../controllers/maintenanceController.js';
import { protect, admin, requireRole } from '../middleware/protect.js';

const router = express.Router();
router.use(protect);

// ── Utility ────────────────────────────────────────────────────────────────────
// Stats — scoped per role automatically in controller
router.get('/stats', requireRole('tenant', 'property_owner', 'maintenance_staff', 'admin'), getStats);

// List maintenance staff (for assign dropdown — owner/admin)
router.get('/staff', requireRole('property_owner', 'admin'), getMaintenanceStaff);

// ── CRUD ──────────────────────────────────────────────────────────────────────
// List — role-scoped in controller
router.get('/', requireRole('tenant', 'property_owner', 'maintenance_staff', 'admin'), listRequests);

// Tenants and admins can submit requests
router.post('/', requireRole('tenant', 'admin'), createRequest);

// Get single — access control enforced inside controller
router.get('/:id', requireRole('tenant', 'property_owner', 'maintenance_staff', 'admin'), getRequest);

// Update basic fields — tenants can update their own open requests; admin always
router.put('/:id', requireRole('tenant', 'admin'), updateRequest);

// Admin-only delete
router.delete('/:id', admin, deleteRequest);

// ── State Machine Transitions ─────────────────────────────────────────────────
// Status transition — staff, owner, admin
router.patch(
  '/:id/status',
  requireRole('maintenance_staff', 'property_owner', 'admin'),
  transitionStatus
);

// Assign staff — owner or admin
router.patch(
  '/:id/assign',
  requireRole('property_owner', 'admin'),
  assignStaff
);

// Tenant feedback — only tenant role
router.patch(
  '/:id/feedback',
  requireRole('tenant'),
  addFeedback
);

export default router;
