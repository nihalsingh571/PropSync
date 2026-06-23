import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export const EyeIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path {...baseProps} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle {...baseProps} cx="12" cy="12" r="3.5" />
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path {...baseProps} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle {...baseProps} cx="12" cy="12" r="3.5" />
    <line {...baseProps} x1="4" y1="4" x2="20" y2="20" />
  </svg>
);
