import express from 'express';
import { protect, requireAdmin } from '../middleware/protect.js';
import {
  getDashboardStatsController,
  getUserAnalyticsController,
  getActivityLogController,
  bulkUserActionController,
  getUserDetailController,
  exportUsersController,
  getSystemHealthController,
  triggerBackupController
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);

// ─── Analytics & Dashboard ────────────────────────────────────────────────────
router.get('/dashboard-stats', requireAdmin('admin'), getDashboardStatsController);
router.get('/user-analytics', requireAdmin('admin'), getUserAnalyticsController);
// Phase 10: router.get('/property-analytics', requireAdmin('admin'), getPropertyAnalyticsController);
// Phase 10: router.get('/maintenance-analytics', requireAdmin('admin'), getMaintenanceAnalyticsController);

// ─── Activity Log ─────────────────────────────────────────────────────────────
router.get('/activity-log', requireAdmin('admin'), getActivityLogController);

// ─── User Management ──────────────────────────────────────────────────────────
router.post('/users/bulk-actions', requireAdmin('admin'), bulkUserActionController);
router.get('/users/export', requireAdmin('admin'), exportUsersController);
router.get('/users/:userId', requireAdmin('admin'), getUserDetailController);

// ─── System ───────────────────────────────────────────────────────────────────
router.get('/system-health', requireAdmin('admin'), getSystemHealthController);
router.post('/backup', requireAdmin('admin'), triggerBackupController);

export default router;
