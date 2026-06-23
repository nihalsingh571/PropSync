import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';
import StatCard from '../../components/Admin/StatCard';
import ChartCard from '../../components/Admin/ChartCard';
import ActivityFeed from '../../components/Admin/ActivityFeed';
import ActivityMonitor from '../../components/Admin/ActivityMonitor';
import { useAdminStore } from '../../stores/adminStore';
import { adminApi } from '../../lib/adminApi';
import { useAdminRealtime } from '../../contexts/AdminRealtimeContext';
import './AdminDashboard.css';

const colors = ['#4f46e5', '#22c55e', '#f97316', '#0ea5e9', '#f43f5e', '#14b8a6'];
const axisTickStyle = { fill: '#cbd5f5', fontSize: 12 };
const axisLineStyle = { stroke: 'rgba(148, 163, 184, 0.35)' };
const gridStroke = 'rgba(148, 163, 184, 0.15)';
const tooltipStyle = {
  backgroundColor: '#0f172a',
  borderColor: '#6366f1',
  borderRadius: 12,
  color: '#f8fafc'
};
const tooltipLabelStyle = { color: '#cbd5f5' };
const RADIAN = Math.PI / 180;

const toNumber = (value: number | string | undefined) =>
  typeof value === 'number' ? value : Number(value ?? 0);

const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name
}: PieLabelRenderProps) => {
  const cxValue = toNumber(cx);
  const cyValue = toNumber(cy);
  const radius =
    toNumber(innerRadius) + (toNumber(outerRadius) - toNumber(innerRadius)) * 0.5;
  const angle = toNumber(midAngle);
  const x = cxValue + radius * Math.cos(-angle * RADIAN);
  const y = cyValue + radius * Math.sin(-angle * RADIAN);
  const percentValue = typeof percent === 'number' ? percent : 0;
  return (
    <text
      x={x}
      y={y}
      fill="#f8fafc"
      textAnchor={x > cxValue ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name ?? ''} ${(percentValue * 100).toFixed(0)}%`}
    </text>
  );
};

const prettyEventName = (name: string) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { dateRange } = useAdminStore();
  const { events, liveUserCount } = useAdminRealtime();
  const [lastManualRefresh, setLastManualRefresh] = React.useState<Date | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard', dateRange],
    queryFn: () => adminApi.getDashboardStats(dateRange)
  });

  const userAnalyticsQuery = useQuery({
    queryKey: ['admin-user-analytics', dateRange],
    queryFn: () => adminApi.getUserAnalytics(dateRange)
  });

  const neighborhoodAnalyticsQuery = useQuery({
    queryKey: ['admin-neighborhood-analytics', dateRange],
    queryFn: () => adminApi.getNeighborhoodAnalytics(dateRange)
  });

  const activityLogQuery = useQuery({
    queryKey: ['admin-activity-log'],
    queryFn: () => adminApi.getActivityLog(1, 10)
  });

  const isLoading =
    dashboardQuery.isLoading ||
    userAnalyticsQuery.isLoading ||
    neighborhoodAnalyticsQuery.isLoading;
  const isRefreshing =
    dashboardQuery.isFetching ||
    userAnalyticsQuery.isFetching ||
    neighborhoodAnalyticsQuery.isFetching;

  const stats = dashboardQuery.data;
  const userAnalytics = userAnalyticsQuery.data;
  const neighborhoodAnalytics = neighborhoodAnalyticsQuery.data;
  const activityItems = stats?.recentActivity ?? activityLogQuery.data?.data ?? [];

  const latestEvent = events[0];
  const activeUserValue = liveUserCount ?? stats?.activeUsers ?? 0;
  const activeUserDescription = liveUserCount ? 'Live in last 15 min' : 'Last selected period';

  const handleManualRefresh = React.useCallback(() => {
    setLastManualRefresh(new Date());
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['admin-neighborhood-analytics'] });
  }, [queryClient]);

  return (
    <AdminLayout>
      <AdminHeader
        title="Admin Dashboard"
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastManualRefresh}
      />
      {isLoading ? (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading insights...</p>
        </div>
      ) : (
        <div className="admin-dashboard">
          {latestEvent && (
            <div className="admin-banner">
              <strong>Live update:</strong> {prettyEventName(latestEvent.event)}
              <span>{new Date(latestEvent.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
          <div className="admin-dashboard-grid stats">
            <StatCard
              label="Total Users"
              value={stats?.totals.users ?? 0}
              description={`${stats?.newUsers?.week ?? 0} new this week`}
              icon="👥"
            />
            <StatCard
              label="Active Users"
              value={activeUserValue}
              description={activeUserDescription}
              icon="⚡"
            />
            <StatCard
              label="Neighborhoods"
              value={stats?.totals.neighborhoods ?? 0}
              description="Curated locations"
              icon="🏘️"
            />
            <StatCard
              label="Reviews"
              value={stats?.totals.reviews ?? 0}
              description="Community feedback"
              icon="⭐"
            />
          </div>

          <div className="admin-dashboard-grid charts">
            <ChartCard title="User Growth">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={userAnalytics?.dailyCounts ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="City Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={neighborhoodAnalytics?.cityDistribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tick={axisTickStyle}
                    axisLine={axisLineStyle}
                    tickLine={axisLineStyle}
                  />
                  <YAxis
                    tick={axisTickStyle}
                    axisLine={axisLineStyle}
                    tickLine={axisLineStyle}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Family Status">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={userAnalytics?.demographics.familyStatus ?? []}
                    dataKey="count"
                    nameKey="_id"
                    innerRadius={40}
                    outerRadius={80}
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {(userAnalytics?.demographics.familyStatus ?? []).map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Views vs Match Success">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={neighborhoodAnalytics?.viewTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="_id" tick={axisTickStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
                  <YAxis tick={axisTickStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="avgViews" stroke="#22c55e" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="avgMatch" stroke="#f97316" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Match Success Distribution">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={neighborhoodAnalytics?.matchSuccessDistribution ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tick={axisTickStyle}
                    axisLine={axisLineStyle}
                    tickLine={axisLineStyle}
                  />
                  <YAxis
                    tick={axisTickStyle}
                    axisLine={axisLineStyle}
                    tickLine={axisLineStyle}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Performing Cities">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart layout="vertical" data={neighborhoodAnalytics?.comparison ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" tick={axisTickStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
                  <YAxis
                    dataKey="_id"
                    type="category"
                    width={120}
                    tick={axisTickStyle}
                    axisLine={axisLineStyle}
                    tickLine={axisLineStyle}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="avgMatch" fill="#a855f7" barSize={20} />
                  <Bar dataKey="avgSentiment" fill="#fbbf24" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="admin-panels">
            <div className="admin-panel">
              <h3>Top Rated Neighborhoods</h3>
              <table className="admin-top-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>City</th>
                    <th>Rating</th>
                    <th>Match Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(neighborhoodAnalytics?.topRated ?? []).map((n) => (
                    <tr key={n._id}>
                      <td>{n.name}</td>
                      <td>{n.city}</td>
                      <td>{n.overallRating?.toFixed(1)}</td>
                      <td>{n.matchSuccessRate ? `${n.matchSuccessRate}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-panel-columns">
              <ActivityFeed items={activityItems} />
              <ActivityMonitor events={events} />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
