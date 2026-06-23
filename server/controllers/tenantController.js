// server/controllers/tenantController.js — PropSync v2
import * as tenantService from '../services/tenantService.js';

const isAdminUser = (user) => user?.roles?.includes('admin') || user?.isAdmin === true;
const isOwner = (user) => user?.roles?.includes('property_owner');

// ── GET /api/tenants ─────────────────────────────────────────────────────────
export const listTenants = async (req, res) => {
  try {
    const { propertyId, status, page, limit, search } = req.query;
    const admin = isAdminUser(req.user);

    const result = await tenantService.listTenants({
      ownerId: admin ? null : (isOwner(req.user) ? req.user._id.toString() : null),
      propertyId,
      status,
      page: page || 1,
      limit: limit || 20,
      search: search || ''
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tenants/stats ───────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const admin = isAdminUser(req.user);
    const stats = await tenantService.getTenantStats(
      admin ? null : req.user._id.toString()
    );
    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tenants/expiring ────────────────────────────────────────────────
export const getExpiringLeases = async (req, res) => {
  try {
    const admin = isAdminUser(req.user);
    const days = Number(req.query.days) || 30;
    const tenants = await tenantService.getExpiringLeases(
      admin ? null : req.user._id.toString(),
      days
    );
    return res.json(tenants);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tenants/me ──────────────────────────────────────────────────────
// Tenant views their own profile
export const getMyProfile = async (req, res) => {
  try {
    const tenant = await tenantService.getTenantByUserId(req.user._id);
    if (!tenant) return res.status(404).json({ message: 'Tenant profile not found' });
    return res.json(tenant);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tenants/:id ─────────────────────────────────────────────────────
export const getTenant = async (req, res) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // Access control: admin sees all, owner sees tenants in their properties, tenant sees own
    const admin = isAdminUser(req.user);
    const isTenant = req.user.roles?.includes('tenant');

    if (!admin) {
      if (isTenant && tenant.userId?._id?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    return res.json(tenant);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid tenant ID' });
    return res.status(500).json({ message: err.message });
  }
};

// ── POST /api/tenants ────────────────────────────────────────────────────────
// Admin or Property Owner can create
export const createTenant = async (req, res) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    return res.status(201).json({ message: 'Tenant created successfully', tenant });
  } catch (err) {
    if (err.message.includes('already occupied') || err.message.includes('already has')) {
      return res.status(409).json({ message: err.message });
    }
    if (err.message.includes('not found')) return res.status(404).json({ message: err.message });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/tenants/:id ─────────────────────────────────────────────────────
export const updateTenant = async (req, res) => {
  try {
    const tenant = await tenantService.updateTenant(
      req.params.id,
      req.body,
      isAdminUser(req.user)
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    return res.json({ message: 'Tenant updated', tenant });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/tenants/:id ──────────────────────────────────────────────────
export const deleteTenant = async (req, res) => {
  try {
    const tenant = await tenantService.deleteTenant(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    return res.json({ message: 'Tenant record deleted' });
  } catch (err) {
    if (err.message.includes('active tenant')) return res.status(409).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};
