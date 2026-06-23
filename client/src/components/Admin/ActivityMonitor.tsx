import React from 'react';
import type { AdminRealtimeEvent } from '../../contexts/AdminRealtimeContext';
import './admin.css';

interface ActivityMonitorProps {
  events: AdminRealtimeEvent[];
}

const formatAge = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 1000) return 'just now';
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const prettyEvent = (name: string) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const ActivityMonitor: React.FC<ActivityMonitorProps> = ({ events }) => (
  <div className="admin-activity-monitor">
    <div className="admin-activity-monitor__header">
      <h3>Live Activity</h3>
      <span>{events.length > 0 ? formatAge(events[0].timestamp) : 'Idle'}</span>
    </div>
    {events.length === 0 ? (
      <p className="empty">Waiting for realtime events…</p>
    ) : (
      <ul>
        {events.map((event) => (
          <li key={`${event.event}-${event.timestamp}`}>
            <div>
              <strong>{prettyEvent(event.event)}</strong>
              <pre>{JSON.stringify(event.payload, null, 2)}</pre>
            </div>
            <span>{formatAge(event.timestamp)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default ActivityMonitor;
