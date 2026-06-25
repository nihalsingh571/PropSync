// server/controllers/authController.js — PropSync v2
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

// ── Valid roles for self-registration ─────────────────────────────────────────
// Admins are created by the seed script or by existing admins only
const SELF_REGISTER_ROLES = ['tenant', 'property_owner', 'maintenance_staff'];

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const buildUserResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  roles: user.roles,
  isAdmin: user.roles?.includes('admin') || user.isAdmin || false,
  token
});

// ── POST /api/auth/register ────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Determine role — default to 'tenant' if not provided or invalid
    const assignedRole = SELF_REGISTER_ROLES.includes(role) ? role : 'tenant';

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || null,
      roles: [assignedRole]
    });
    return res.status(201).json(buildUserResponse(user, generateToken(user._id)));
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // password field is select:false — must explicitly include it
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.suspended) {
      return res.status(403).json({ message: 'Account suspended. Contact support.' });
    }

    if (user.softDeleted) {
      return res.status(403).json({ message: 'Account no longer exists.' });
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    return res.json(buildUserResponse(user, generateToken(user._id)));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// ── GET /api/auth/users (Admin) ───────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const { role, suspended, softDeleted, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (role) filter.roles = role;
    if (suspended !== undefined) filter.suspended = suspended === 'true';
    if (softDeleted !== undefined) filter.softDeleted = softDeleted === 'true';
    else filter.softDeleted = false; // default: exclude soft-deleted

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    return res.json({
      users,
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// ── PUT /api/auth/users/:id/role (Admin) ──────────────────────────────────────
export const updateUserRole = async (req, res) => {
  try {
    const { roles } = req.body;
    const validRoles = ['admin', 'property_owner', 'tenant', 'maintenance_staff'];

    if (!Array.isArray(roles) || !roles.every(r => validRoles.includes(r))) {
      return res.status(400).json({
        message: `Invalid role(s). Must be one of: ${validRoles.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { roles, isAdmin: roles.includes('admin') } },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User role updated', user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update role' });
  }
};

// ── DELETE /api/auth/users/:id (Admin) ────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { softDeleted: true, suspended: true } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User soft deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always respond with success for security (don't reveal if email exists)
  if (!user) {
    return res.status(200).json({
      message: "If an account with that email exists, we've sent reset instructions"
    });
  }

  const resetToken = jwt.sign(
    { id: user._id, type: 'reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save({ validateBeforeSave: false });

  try {
    const emailService = await import('../services/emailService.js');
    await emailService.sendResetPasswordEmail(user.email, resetToken);
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(200).json({
      message: "If an account with that email exists, we've sent reset instructions"
    });
  }
  // Dev: return token for testing
  return res.status(200).json({
    message: 'Reset instructions sent (dev mode: token returned)',
    resetToken
  });
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Missing token or password' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'reset') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.resetPasswordToken !== token) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};
