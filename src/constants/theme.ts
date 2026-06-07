export const COLORS = {
  background: '#fafafa',
  surface: '#ffffff',
  text: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#eeeeee',
  primary: '#111111',
  primaryText: '#ffffff',
  accent: '#e53935',
  success: '#4caf50',
  warning: '#fb8c00',
  gold: '#ffd700',
  timer: {
    normal: '#111111',
    urgent: '#e53935',
  },
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  title: 36,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;
