// server/controllers/userController.js — PropSync v2
// NOTE: Core user management has moved to authController.js.
// This file is kept for additional profile/preference endpoints.

import User from '../models/userModel.js';

// ── GET /api/users/:id/profile ─────────────────────────────────────────────────
// Any authenticated user can view a public profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('_id name email phone roles profileImage createdAt lastActive')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/users/profile ─────────────────────────────────────────────────────
// Authenticated users update their own profile
export const updateOwnProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    const allowedUpdates = {};
    if (name) allowedUpdates.name = name.trim();
    if (phone !== undefined) allowedUpdates.phone = phone;
    if (profileImage !== undefined) allowedUpdates.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    return res.json({ message: 'Profile updated', user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── Deprecated exports kept so imports don't break during Phase 3 transition ───
// These now delegate to the updated authController functions.
export const getAllUsers = async (req, res) => {
  // Redirect to the one in authController — this is here for backward compat only
  return res.status(410).json({ message: 'Use GET /api/auth/users instead' });
};
export const updateUserAdmin = async (req, res) => {
  return res.status(410).json({ message: 'Use PUT /api/auth/users/:id/role instead' });
};
export const deleteUser = async (req, res) => {
  return res.status(410).json({ message: 'Use DELETE /api/auth/users/:id instead' });
};
