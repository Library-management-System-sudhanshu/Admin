import React, { useState } from 'react';
import { CustomCalendar } from '../components/ui/CustomCalendar';
import { Card } from '../components/ui/Card';
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { formatYYYYMMDD } from '../utils/dateUtils';

export default function CalendarDemo() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2024, 1, 14)); // Feb 14, 2024 default

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-navy)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarIcon size={26} style={{ color: '#D97706' }} /> Custom Calendar Component
        </h1>
        <p style={{ margin: 0, color: 'var(--text-slate)', fontSize: '0.95rem' }}>
          A clean, modern, and pixel-perfect calendar widget designed with smooth interactions and warm orange selection states.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '32px', alignItems: 'start' }}>
        {/* Calendar Widget Display Container */}
        <div>
          <CustomCalendar
            standalone
            value={selectedDate}
            onChange={(d) => setSelectedDate(d)}
          />
        </div>

        {/* Calendar Details / Selection Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card elevation="sm" style={{ padding: '24px', borderRadius: '20px', background: '#ffffff', border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-navy)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: '#D97706' }} /> Selected Date Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFBEB', padding: '12px 16px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400E' }}>Formatted Date:</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#B45309' }}>
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'None'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-slate)' }}>ISO String:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-navy)', fontFamily: 'monospace' }}>
                  {formatYYYYMMDD(selectedDate) || 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          <Card elevation="sm" style={{ padding: '24px', borderRadius: '20px', background: '#ffffff', border: '1px solid var(--border-card)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-navy)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: '#10B981' }} /> Design Specifications Applied
            </h3>

            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li><strong>Card Container:</strong> 24px border radius, 24px padding, subtle shadow.</li>
              <li><strong>Header:</strong> 28px bold month title, touchable arrow buttons for month navigation.</li>
              <li><strong>Weekday Row:</strong> Bold single-letter labels (<code>M T W T F S S</code>) in 7 columns.</li>
              <li><strong>Selected Date:</strong> 48px circle in <code>#D97706</code> warm orange with white bold text & scale animation.</li>
              <li><strong>Overflow Days:</strong> Light gray <code>#D8D8D8</code> for previous & next month dates.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
