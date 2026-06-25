// client/src/components/Shared/Skeleton.tsx — PropSync
import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '6px',
  className = ''
}) => (
  <div
    className={`skeleton-pulse ${className}`}
    style={{ width, height, borderRadius }}
  />
);

export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="skeleton-card">
    <Skeleton height="1.25rem" width="60%" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="0.85rem" width={i === lines - 1 ? '40%' : '100%'} />
    ))}
  </div>
);

export const SkeletonStat: React.FC = () => (
  <div className="skeleton-stat">
    <Skeleton height="2rem" width="2rem" borderRadius="50%" />
    <Skeleton height="1.5rem" width="60%" />
    <Skeleton height="0.75rem" width="40%" />
  </div>
);

export default Skeleton;
