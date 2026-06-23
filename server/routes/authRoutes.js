// server/routes/authRoutes.js — PropSync v2
import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUserRole,
  deleteUser
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/protect.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ── Admin: User Management ────────────────────────────────────────────────────
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);     // updated from /admin
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
