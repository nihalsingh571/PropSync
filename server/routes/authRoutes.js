// server/routes/authRoutes.js — PropSync v2
import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUserRole,
  deleteUser,
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FA
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/protect.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-2fa', verify2FA);

// ── Protected 2FA Routes ──────────────────────────────────────────────────────
router.post('/setup-2fa', protect, setup2FA);
router.post('/enable-2fa', protect, enable2FA);
router.post('/disable-2fa', protect, disable2FA);

// ── Admin: User Management ────────────────────────────────────────────────────
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);     // updated from /admin
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
