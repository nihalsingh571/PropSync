// server/routes/notificationRoutes.js — PropSync v2
import express from 'express';
import {
  getUnreadCount,
  listNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  purgeRead,
  adminSend
} from '../controllers/notificationController.js';
import { protect, admin } from '../middleware/protect.js';

const router = express.Router();
router.use(protect);

// ── Read ───────────────────────────────────────────────────────────────────────
router.get('/unread-count', getUnreadCount);
router.get('/', listNotifications);

// ── Write ──────────────────────────────────────────────────────────────────────
router.patch('/mark-all-read',  markAllRead);
router.patch('/:id/read',       markRead);
router.delete('/purge-read',    purgeRead);
router.delete('/:id',           deleteNotification);

// ── Admin ──────────────────────────────────────────────────────────────────────
router.post('/send', admin, adminSend);

export default router;
