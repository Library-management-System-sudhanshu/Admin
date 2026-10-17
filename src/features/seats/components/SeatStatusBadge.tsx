import React from 'react';

export interface SeatStatusBadgeProps {
  status?: string;
  isExpired?: boolean;
  occupancyPercent?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const SeatStatusBadge: React.FC<SeatStatusBadgeProps> = ({
  status = 'AVAILABLE',
  isExpired = false,
  occupancyPercent,
  className = '',
  style,
}) => {
  if (occupancyPercent !== undefined) {
    const isHigh = occupancyPercent >= 80;
    return (
      <span
        className={`status-pill ${isHigh ? 'occupied' : 'available'} ${className}`}
        style={{ padding: '2px 8px', fontSize: '0.675rem', fontWeight: 700, borderRadius: '6px', ...style }}
      >
        {occupancyPercent}% Occupancy
      </span>
    );
  }

  const normalizedStatus = isExpired ? 'expired' : status.toLowerCase();
  const label = isExpired
    ? 'Expired'
    : status === 'OCCUPIED'
    ? 'Occupied'
    : status === 'AVAILABLE'
    ? 'Available'
    : status === 'MAINTENANCE'
    ? 'Maintenance'
    : status === 'BLOCKED'
    ? 'Blocked'
    : status;

  return (
    <span
      className={`status-pill ${normalizedStatus} ${className}`}
      style={{ padding: '2px 8px', fontSize: '0.675rem', fontWeight: 700, borderRadius: '6px', textTransform: 'capitalize', ...style }}
    >
      {label}
    </span>
  );
};
