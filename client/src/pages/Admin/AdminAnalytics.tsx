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

  const neighborhoodAnalyticsQuery = useQuery({
    queryKey: ['admin-neighborhood-analytics', dateRange],
    queryFn: () => adminApi.getNeighborhoodAnalytics(dateRange)
  });

  const isLoading = userAnalyticsQuery.isLoading || neighborhoodAnalyticsQuery.isLoading;
  const isRefreshing = userAnalyticsQuery.isFetching || neighborhoodAnalyticsQuery.isFetching;

  const userAnalytics = userAnalyticsQuery.data;
  const neighborhoodAnalytics = neighborhoodAnalyticsQuery.data;
  const latestEvent = events[0];

  const handleManualRefresh = () => {
    setLastManualRefresh(new Date());
    queryClient.invalidateQueries({ queryKey: ['admin-user-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['admin-neighborhood-analytics'] });
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

            <ChartCard title="Family Status Breakdown">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={userAnalytics?.demographics.familyStatus ?? []}
                    dataKey="count"
                    nameKey="_id"
                    outerRadius={90}
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
                  <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Views vs Match Success">
              <ResponsiveContainer width="100%" height={260}>
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
              <ResponsiveContainer width="100%" height={260}>
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
                  <Bar dataKey="count" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Performing Cities">
              <ResponsiveContainer width="100%" height={260}>
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
