/**
 * Single Source of Truth for Application Theme Colors & Tokens.
 * Synchronized with CSS variables defined in Globals.css.
 */
export const themeColors = {
  // Core Brand Colors
  primary: '#2563EB',        // --accent-blue
  primaryHover: '#1D4ED8',
  primaryLight: '#EFF6FF',
  bgApp: '#F6F8FB',         // --bg-app
  bgCard: '#FFFFFF',

  // Typography Colors
  textNavy: '#0F172A',       // --text-navy
  textSlate: '#64748B',      // --text-slate
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // Borders
  borderSubtle: '#E5E7EB',   // --border-subtle
  borderCard: '#E5E7EB',     // --border-card

  // Status & Accent Palette
  emerald: '#10B981',        // --status-emerald
  red: '#EF4444',            // --status-red
  amber: '#F59E0B',          // --status-amber
  purple: '#8B5CF6',         // --status-purple
  gold: '#D97706',           // --status-gold
  gray: '#64748B',           // --status-gray

  // Recharts & UI Components Palette
  chartPrimary: '#2563EB',
  chartSecondary: '#E2E8F0',

  // Accent RGBs for translucent overlays
  accentBlueRgb: '37, 99, 235',
  statusGoldRgb: '217, 119, 6',
} as const;

export type ThemeColors = typeof themeColors;
export default themeColors;
