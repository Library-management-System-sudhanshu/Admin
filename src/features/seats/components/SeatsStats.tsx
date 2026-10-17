import React from 'react';
import { Armchair, Users, CheckCircle, Clock } from 'lucide-react';
import type { SeatStatsData } from '../types';

export interface SeatsStatsProps {
  stats: SeatStatsData;
  expiringCount?: number;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export const SeatsStats: React.FC<SeatsStatsProps> = ({
  stats,
  expiringCount = 0,
  activeFilter,
  onFilterChange,
}) => {
  const cards = [
    {
      id: 'TOTAL',
      label: 'Total Capacity',
      value: stats.total,
      icon: Armchair,
      color: 'var(--accent-blue)',
      bg: 'rgba(37, 99, 235, 0.08)',
      meta: `${stats.occupancyRate}% Floor Occupancy`,
    },
    {
      id: 'OCCUPIED',
      label: 'Occupied Seats',
      value: stats.occupied,
      icon: Users,
      color: 'var(--status-red, #dc2626)',
      bg: 'rgba(220, 38, 38, 0.08)',
      meta: `${stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}% Allocated`,
    },
    {
      id: 'AVAILABLE',
      label: 'Available Seats',
      value: stats.available,
      icon: CheckCircle,
      color: 'var(--status-emerald, #059669)',
      bg: 'rgba(5, 150, 105, 0.08)',
      meta: 'Ready for booking',
    },
    {
      id: 'EXPIRING',
      label: 'Expiring Soon',
      value: expiringCount,
      icon: Clock,
      color: 'var(--status-amber, #d97706)',
      bg: 'rgba(217, 119, 6, 0.08)',
      meta: 'Within next 7 days',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        margin: '16px 0',
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onFilterChange && onFilterChange(card.id)}
            style={{
              backgroundColor: '#ffffff',
              border: isSelected ? `2px solid ${card.color}` : '1px solid rgba(15, 23, 42, 0.06)',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'var(--shadow-soft)',
              cursor: onFilterChange ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={20} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {card.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-navy)', fontVariantNumeric: 'tabular-nums' }}>
                  {card.value}
                </span>
                <span style={{ fontSize: '0.675rem', color: card.color, fontWeight: 700 }}>
                  {card.meta}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
