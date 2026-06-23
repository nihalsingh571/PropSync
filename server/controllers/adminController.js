import {
  getDashboardStats,
  getUserAnalytics
} from '../services/analyticsService.js';
import {
  getActivityLog,
  bulkUserAction,
  getUserDetail,
  exportUsersCsv,
  getSystemHealth,
  triggerBackup
} from '../services/adminService.js';

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export const getDashboardStatsController = async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const stats = await getDashboardStats(range);
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
};

// ─── User Analytics ───────────────────────────────────────────────────────────
export const getUserAnalyticsController = async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const data = await getUserAnalytics(range);
    res.json(data);
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ message: 'Failed to load user analytics' });
  }
};

// ─── Activity Log ─────────────────────────────────────────────────────────────
export const getActivityLogController = async (req, res) => {
  try {
    const { page = 1, limit = 25, action, adminId } = req.query;
    const data = await getActivityLog({
      page: Number(page),
      limit: Number(limit),
      action,
      adminId
    });
    res.json(data);
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ message: 'Failed to load activity log' });
  }
};

// ─── Bulk User Actions ────────────────────────────────────────────────────────
export const bulkUserActionController = async (req, res) => {
  try {
    const { action, userIds, payload } = req.body;
    const result = await bulkUserAction({
      action,
      userIds,
      payload,
      actorId: req.user._id,
      req
    });
    res.json(result);
  } catch (error) {
    console.error('Bulk user action error:', error);
    res.status(400).json({ message: error.message });
  }
};

// ─── User Detail ──────────────────────────────────────────────────────────────
export const getUserDetailController = async (req, res) => {
  try {
    const detail = await getUserDetail(req.params.userId);
    res.json(detail);
  } catch (error) {
    console.error('User detail error:', error);
    res.status(404).json({ message: error.message });
  }
};

// ─── Export Users CSV ─────────────────────────────────────────────────────────
export const exportUsersController = async (req, res) => {
  try {
    const buffer = await exportUsersCsv({ filter: { softDeleted: false } });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="propsync-users.csv"');
    res.send(buffer);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ message: 'Failed to export users' });
  }
};

// ─── System Health ────────────────────────────────────────────────────────────
export const getSystemHealthController = async (req, res) => {
  try {
    const status = await getSystemHealth();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'System health check failed' });
  }
};

// ─── Trigger Backup ───────────────────────────────────────────────────────────
export const triggerBackupController = async (req, res) => {
  try {
    const result = await triggerBackup({ actorId: req.user._id, req });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to queue backup' });
  }
};
