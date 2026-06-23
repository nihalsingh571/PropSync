// server/middleware/protect.js — PropSync v2
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const LAST_ACTIVE_UPDATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ── JWT Authentication ─────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) return res.status(401).json({ message: 'Not authorized — no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) return res.status(401).json({ message: 'User not found' });
    if (req.user.suspended) return res.status(403).json({ message: 'Account suspended' });
    if (req.user.softDeleted) return res.status(403).json({ message: 'Account no longer exists' });

    // Throttled lastActive update
    if (
      !req.user.lastActive ||
      Date.now() - new Date(req.user.lastActive).getTime() > LAST_ACTIVE_UPDATE_WINDOW_MS
    ) {
      req.user.lastActive = new Date();
      await req.user.save({ validateBeforeSave: false });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ── Role Helpers ───────────────────────────────────────────────────────────────

const hasRole = (user, role) => {
  if (!user) return false;
  const roles = user.roles || [];
  // Admin backward-compat: also check isAdmin flag
  if (role === 'admin') return roles.includes('admin') || user.isAdmin === true;
  return roles.includes(role);
};

// ── admin: shorthand guard for admin-only routes ──────────────────────────────
export const admin = (req, res, next) => {
  if (hasRole(req.user, 'admin')) return next();
  return res.status(403).json({ message: 'Admin access required' });
};

// ── requireAdmin: level-based guard (kept for backward compat) ────────────────
export const requireAdmin = (level = 'admin') => (req, res, next) => {
  if (hasRole(req.user, 'admin')) return next();
  return res.status(403).json({ message: 'Admin access required' });
};

// ── requireRole: PropSync role-based guards ───────────────────────────────────
// Usage: router.get('/my-properties', protect, requireRole('property_owner'), handler)
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  // Admin always has access to everything
  if (hasRole(req.user, 'admin')) return next();

  const hasAny = roles.some(role => hasRole(req.user, role));
  if (!hasAny) {
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(' or ')}`
    });
  }

  return next();
};

// ── requireAnyRole: alias for requireRole with spread ─────────────────────────
export const requireAnyRole = (roleArray) => requireRole(...roleArray);

// ── Convenience exports for common role combinations ─────────────────────────
export const propertyOwnerOrAdmin = requireRole('property_owner');
export const tenantOrAdmin = requireRole('tenant');
export const maintenanceStaffOrAdmin = requireRole('maintenance_staff');
