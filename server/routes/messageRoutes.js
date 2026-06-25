// server/routes/messageRoutes.js — PropSync In-App Messaging
import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  startTenantChat
} from '../controllers/messageController.js';
import { protect, requireRole } from '../middleware/protect.js';

const router = express.Router();

// All message routes require authentication
router.use(protect);
router.use(requireRole('tenant', 'property_owner', 'admin'));

// ── Conversations ─────────────────────────────────────────────────────────────
router.get('/conversations', getConversations);
router.get('/conversations/:id', getMessages);
router.post('/conversations/:id/send', sendMessage);

// ── Unread count (for badge) ──────────────────────────────────────────────────
router.get('/unread-count', getUnreadCount);

// ── Tenant start chat ─────────────────────────────────────────────────────────
router.post('/tenant/start-chat', requireRole('tenant'), startTenantChat);

export default router;
