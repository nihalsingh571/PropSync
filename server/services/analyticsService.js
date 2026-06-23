import User from '../models/userModel.js';
import AdminActivityLog from '../models/adminActivityLogModel.js';
import AnalyticsCache from '../models/analyticsCacheModel.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const rangeMap = { '7d': 7, '30d': 30, '90d': 90 };

const parseRange = (range = '7d') => {
  if (typeof range !== 'string') return 7;
  return rangeMap[range] || 7;
};

const cacheResult = async (key, ttlSeconds, generator) => {
  const now = new Date();
  const cached = await AnalyticsCache.findOne({ key, expiresAt: { $gt: now } });
  if (cached) return cached.payload;

  const payload = await generator();
  await AnalyticsCache.findOneAndUpdate(
    { key },
    {
      payload,
      ttl: ttlSeconds,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000)
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return payload;
};

const buildDailyBuckets = (days) => {
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    buckets.push({
      date,
      formatted: date.toISOString().split('T')[0],
      count: 0
    });
  }
  return buckets;
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
// NOTE: Phase 10 will expand this with property/maintenance/booking KPIs.

export const getDashboardStats = async (range = '7d') => {
  const days = parseRange(range);
  const cacheKey = `dashboard:${days}`;
  return cacheResult(cacheKey, 60, async () => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      activeUsers,
      recentActivity
    ] = await Promise.all([
      User.countDocuments({ softDeleted: false }),
      User.countDocuments({ createdAt: { $gte: startOfDay }, softDeleted: false }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, softDeleted: false }),
      User.countDocuments({ createdAt: { $gte: monthAgo }, softDeleted: false }),
      User.countDocuments({ lastActive: { $gte: rangeStart }, suspended: false, softDeleted: false }),
      AdminActivityLog.find({ createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    ]);

    const heatmapAgg = await AdminActivityLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          hour: { $hour: '$createdAt' }
        }
      },
      { $group: { _id: { day: '$day', hour: '$hour' }, count: { $sum: 1 } } }
    ]);

    const heatmap = heatmapAgg.map(entry => ({
      day: entry._id.day,
      hour: entry._id.hour,
      count: entry.count
    }));

    return {
      totals: {
        users: totalUsers,
        // Phase 4 will add: properties, tenants
        // Phase 6 will add: maintenanceRequests
        // Phase 8 will add: bookings
      },
      newUsers: {
        today: newUsersToday,
        week: newUsersWeek,
        month: newUsersMonth
      },
      activeUsers,
      recentActivity,
      heatmap
    };
  });
};

// ─── User Analytics ───────────────────────────────────────────────────────────

export const getUserAnalytics = async (range = '30d') => {
  const days = parseRange(range);
  const cacheKey = `userAnalytics:${days}`;
  return cacheResult(cacheKey, 120, async () => {
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (days - 1));

    const dailyAgg = await User.aggregate([
      { $match: { createdAt: { $gte: rangeStart }, softDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    const buckets = buildDailyBuckets(days);
    const bucketMap = Object.fromEntries(buckets.map(b => [b.formatted, b]));
    dailyAgg.forEach(day => {
      if (bucketMap[day._id]) {
        bucketMap[day._id].count = day.count;
      }
    });

    // PropSync role distribution
    const roleDistribution = await User.aggregate([
      { $match: { softDeleted: false } },
      { $unwind: '$roles' },
      { $group: { _id: '$roles', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      dailyCounts: buckets.map(b => ({ date: b.formatted, count: b.count })),
      roleDistribution
    };
  });
};

export const getActivityHeatmap = async (days = 7) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return AdminActivityLog.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          hour: { $hour: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.day': 1, '_id.hour': 1 } }
  ]);
};
