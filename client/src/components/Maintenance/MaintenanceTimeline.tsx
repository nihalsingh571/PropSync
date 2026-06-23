import React from 'react';
import type { TimelineEvent } from '../../lib/maintenanceApi';
import { STATUS_CONFIG } from '../../lib/maintenanceApi';
import './Maintenance.css';

interface MaintenanceTimelineProps {
  timeline: TimelineEvent[];
}

const MaintenanceTimeline: React.FC<MaintenanceTimelineProps> = ({ timeline }) => {
  if (!timeline?.length) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No history yet</p>;

  return (
    <div className="timeline">
      {[...timeline].reverse().map((event, i) => {
        const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.open;
        const actor = typeof event.changedBy === 'object' ? event.changedBy.name : 'System';
        const dt = new Date(event.changedAt);
        return (
          <div key={event._id ?? i} className={`timeline-item ${i === 0 ? 'timeline-item--latest' : ''}`}>
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-header">
                <span className={`shared-badge ${cfg.cls}`}>{cfg.label}</span>
                <span className="timeline-actor">{actor}</span>
                <span className="timeline-date">
                  {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                  {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {event.note && <p className="timeline-note">{event.note}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MaintenanceTimeline;
