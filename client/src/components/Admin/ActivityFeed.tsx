import React from 'react';
import type { RecentActivityItem } from '../../lib/adminApi';
import './admin.css';

interface ActivityFeedProps {
  items: RecentActivityItem[];
}

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString();
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items }) => (
  <div className="admin-activity-feed">
    <h3>Recent Activity</h3>
    {items.length === 0 && <p className="empty">No activity yet.</p>}
    <ul>
      {items.map((item) => (
        <li key={item._id}>
          <div>
            <strong>{item.action}</strong> · <span>{item.entityType}</span>
            {item.adminId && <span> · {item.adminId.name}</span>}
          </div>
          <span className="timestamp">{formatTimestamp(item.createdAt)}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default ActivityFeed;
