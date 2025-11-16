/**
 * Siloq Design System
 *
 * Brand Identity:
 * - Primary: Siloq Blue (#2F6D92)
 * - Accent: Siloq Mint (#63D1C5)
 * - Typography: Lora (headers), Gibson (body/UI)
 */

export const COLORS = {
  // Primary Brand - Siloq Blue
  primary: {
    600: '#2F6D92', // Main brand color
    500: '#3A7EA3',
    700: '#245975',
    800: '#1A4256',
  },

  // Accent - Siloq Mint
  accent: {
    300: '#7DDED5',
    400: '#63D1C5', // Main accent color
    500: '#2CBFB0',
  },

  // Neutral Grays (Cool & Modern)
  gray: {
    50: '#F8FAFC',  // App background
    100: '#F1F5F9',
    200: '#E2E8F0', // Borders
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B', // Muted text
    600: '#475569',
    700: '#334155',
    900: '#0F172A', // Headers / high-contrast text
  },

  // Status Colors
  success: '#4CAF50',
  warning: '#E0A100',
  error: '#E5484D',
  destructive: '#E5484D', // Alias for error
  info: '#3B82F6',
  muted: '#64748B', // Alias for gray[500]

  // Convenience aliases
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Semantic color mappings for easier usage
export const THEME = {
  // Backgrounds
  background: COLORS.gray[50],
  surface: COLORS.white,

  // Text
  text: {
    primary: COLORS.gray[900],
    secondary: COLORS.gray[500],
    disabled: COLORS.gray[400],
    inverse: COLORS.white,
  },

  // Borders
  border: {
    default: COLORS.gray[200],
    focus: COLORS.primary[600],
    error: COLORS.error,
  },

  // Buttons
  button: {
    primary: {
      background: COLORS.primary[600],
      hover: COLORS.primary[700],
      text: COLORS.white,
    },
    secondary: {
      background: COLORS.white,
      border: COLORS.gray[300],
      text: COLORS.primary[600],
    },
    accent: {
      background: COLORS.accent[400],
      hover: COLORS.accent[500],
      text: COLORS.white,
    },
  },

  // Status
  status: {
    success: COLORS.success,
    warning: COLORS.warning,
    error: COLORS.error,
    info: COLORS.info,
  },

  // Invoice/Estimate specific
  invoice: {
    draft: COLORS.gray[500],
    sent: COLORS.warning,
    paid: COLORS.success,
    overdue: COLORS.error,
  },

  estimate: {
    pending: COLORS.info,
    accepted: COLORS.success,
    rejected: COLORS.error,
    expired: COLORS.gray[500],
  },
} as const;

// Typography guidelines (for reference - React Native uses system fonts)
export const TYPOGRAPHY = {
  // Lora - for headers, titles, branding
  headers: {
    fontFamily: 'Lora', // Would need custom font loading
    usage: ['Page titles', 'Section headers', 'Branding'],
  },

  // Gibson - for body text, UI labels, tables, forms, buttons
  body: {
    fontFamily: 'Gibson', // Would need custom font loading
    usage: ['Body text', 'Navigation', 'UI labels', 'Buttons', 'Tables and lists'],
  },

  // Font sizes
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// Border radius
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
