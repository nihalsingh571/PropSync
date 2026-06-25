import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';
import ChartCard from '../../components/Admin/ChartCard';
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

const renderPieLabel = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
  name
}: PieLabelRenderProps) => {
  const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
  const x = Number(cx) + radius * Math.cos(-midAngle * RADIAN);
  const y = Number(cy) + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#f8fafc"
      textAnchor={x > Number(cx) ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name ?? ''} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const prettyEventName = (name: string) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const AdminAnalytics: React.FC = () => {
  const { dateRange } = useAdminStore();
  const queryClient = useQueryClient();
  const { events } = useAdminRealtime();
  const [lastManualRefresh, setLastManualRefresh] = React.useState<Date | null>(null);

  const userAnalyticsQuery = useQuery({
    queryKey: ['admin-user-analytics', dateRange],
    queryFn: () => adminApi.getUserAnalytics(dateRange)
  });

  const isLoading = userAnalyticsQuery.isLoading;
  const isRefreshing = userAnalyticsQuery.isFetching;

  const userAnalytics = userAnalyticsQuery.data;
  const latestEvent = events[0];

  const handleManualRefresh = () => {
    setLastManualRefresh(new Date());
    queryClient.invalidateQueries({ queryKey: ['admin-user-analytics'] });
  };

  return (
    <AdminLayout>
      <AdminHeader
        title="Advanced Analytics"
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastManualRefresh}
      />
      {latestEvent && (
        <div className="admin-banner">
          <strong>Live update:</strong> {prettyEventName(latestEvent.event)}
          <span>{new Date(latestEvent.timestamp).toLocaleTimeString()}</span>
        </div>
      )}
      {isLoading ? (
        <div className="admin-loading">
          <div className="loading-spinner" />
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>
          <div className="admin-dashboard-grid charts">
            <ChartCard title="User Growth (Selected Range)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={userAnalytics?.dailyCounts ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="date" tick={axisTickStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
                  <YAxis tick={axisTickStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Role Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={userAnalytics?.roleDistribution ?? []}
                    dataKey="count"
                    nameKey="_id"
                    outerRadius={90}
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {(userAnalytics?.roleDistribution ?? []).map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value, name) => [value, prettyEventName(String(name))]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div className="admin-panels">
            <div className="admin-panel">
              <h3>Realtime Events</h3>
              <ActivityMonitor events={events} />
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminAnalytics;
