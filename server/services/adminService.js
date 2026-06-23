import mongoose from 'mongoose';
import User from '../models/userModel.js';
import AdminActivityLog from '../models/adminActivityLogModel.js';
import { Parser } from 'json2csv';
import {
  emitAdminActionEvent,
  emitSystemAlert
} from './realtimeService.js';

// ─── Record Admin Action (Audit Log) ─────────────────────────────────────────

export const recordAdminAction = async ({ adminId, action, entityType, entityId, metadata, req }) => {
  const log = await AdminActivityLog.create({
    adminId,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress: req?.ip
  });
  emitAdminActionEvent({
    adminId,
    action,
    entityType,
    entityId,
    metadata
  });
  return log;
};

// ─── Activity Log (Paginated) ─────────────────────────────────────────────────

export const getActivityLog = async ({ page = 1, limit = 25, action, adminId }) => {
  const query = {};
  if (action) query.action = action;
  if (adminId) query.adminId = adminId;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    AdminActivityLog.find(query)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdminActivityLog.countDocuments(query)
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// ─── Bulk User Actions ────────────────────────────────────────────────────────

export const bulkUserAction = async ({ action, userIds, payload = {}, actorId, req }) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('userIds array is required');
  }

  let result;
  switch (action) {
    case 'suspend':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { suspended: true } }
      );
      break;
    case 'activate':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { suspended: false } }
      );
      break;
    case 'softDelete':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { softDeleted: true, suspended: true } }
      );
      break;
    case 'restore':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { softDeleted: false } }
      );
      break;
    case 'setAdmin':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $addToSet: { roles: 'admin' }, $set: { isAdmin: true } }
      );
      break;
    case 'removeAdmin':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $pull: { roles: 'admin' }, $set: { isAdmin: false } }
      );
      break;
    // PropSync-specific role actions (Phase 3+)
    case 'setPropertyOwner':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $addToSet: { roles: 'property_owner' } }
      );
      break;
    case 'setTenant':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $addToSet: { roles: 'tenant' } }
      );
      break;
    case 'setMaintenanceStaff':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { $addToSet: { roles: 'maintenance_staff' } }
      );
      break;
    default:
      throw new Error(`Unsupported bulk action: ${action}`);
  }

  await recordAdminAction({
    adminId: actorId,
    action: `users.${action}`,
    entityType: 'user',
    entityId: userIds.join(','),
    metadata: { payload, processed: result.modifiedCount },
    req
  });

  return {
    success: true,
    processed: result.modifiedCount,
    matched: result.matchedCount
  };
};

// ─── User Detail ──────────────────────────────────────────────────────────────

export const getUserDetail = async (userId) => {
  const user = await User.findById(userId).select('-password').lean();
  if (!user) throw new Error('User not found');

  // Phase 5+: Add tenant data, Phase 6+: Add maintenance requests
  return { user };
};

// ─── Export Users CSV ─────────────────────────────────────────────────────────

export const exportUsersCsv = async ({ filter = {} }) => {
  const users = await User.find(filter)
    .select('name email roles phone lastActive createdAt suspended softDeleted')
    .lean();

  const parser = new Parser({
    fields: [
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Roles', value: row => row.roles?.join('|') || '' },
      { label: 'Phone', value: 'phone' },
      { label: 'Last Active', value: row => row.lastActive ? new Date(row.lastActive).toISOString() : '' },
      { label: 'Created At', value: row => row.createdAt?.toISOString?.() || '' },
      { label: 'Suspended', value: row => row.suspended ? 'Yes' : 'No' },
      { label: 'Soft Deleted', value: row => row.softDeleted ? 'Yes' : 'No' }
    ]
  });

  const csv = parser.parse(users);
  return Buffer.from(csv, 'utf-8');
};

// ─── System Health ────────────────────────────────────────────────────────────

export const getSystemHealth = async () => {
  const mongoState = mongoose.connection.readyState;
  return {
    uptime: process.uptime(),
    dbStatus: mongoState === 1 ? 'connected' : 'disconnected',
    memoryUsage: process.memoryUsage(),
    timestamp: new Date()
  };
};

// ─── Trigger Backup ───────────────────────────────────────────────────────────

export const triggerBackup = async ({ actorId, req }) => {
  const jobId = `backup_${Date.now()}`;
  await recordAdminAction({
    adminId: actorId,
    action: 'system.backup',
    entityType: 'system',
    entityId: jobId,
    metadata: { status: 'queued' },
    req
  });
  emitSystemAlert({
    severity: 'info',
    message: 'Backup job queued',
    jobId
  });
  return { jobId, status: 'queued' };
};
