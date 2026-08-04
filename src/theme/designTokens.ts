// Centralized Enterprise Design Token System for VERIIGO.COM
// Strict WCAG AA Typography & Contrast Color Tokens

export const designTokens = {
  colors: {
    background: '#0B1220',
    surface: '#111827',
    surfaceElevated: '#1E293B',
    glass: 'rgba(255, 255, 255, 0.08)',
    glassHover: 'rgba(255, 255, 255, 0.12)',
    glassActive: 'rgba(255, 255, 255, 0.16)',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    glassBorderHover: 'rgba(59, 130, 246, 0.45)',
    
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryGlow: 'rgba(59, 130, 246, 0.35)',
    
    accent: '#22C55E',
    accentHover: '#16A34A',
    accentGlow: 'rgba(34, 197, 94, 0.35)',
    
    warning: '#FBBF24',
    warningHover: '#D97706',
    
    danger: '#F87171',
    dangerHover: '#DC2626',
    
    // Semantic Typography Tokens (WCAG AA Compliant)
    textDisplay: '#FFFFFF',
    textPageTitle: '#F8FAFC',
    textSectionTitle: '#E2E8F0',
    textCardTitle: '#F8FAFC',
    textFormLabel: '#CBD5E1', // 14-15px, 500 wt, readable contrast > 7:1
    textInputValue: '#F8FAFC',
    textBody: '#E2E8F0',
    textSecondary: '#94A3B8', // > 4.5:1
    textCaption: '#94A3B8',
    textDisabled: '#64748B',

    // Status Tokens
    statusError: '#F87171',
    statusWarning: '#FBBF24',
    statusSuccess: '#22C55E',
    statusInfo: '#60A5FA',
  },
  
  typography: {
    fontFamily: "'IBM Plex Sans Thai', 'LINE Seed Sans TH', 'Noto Sans Thai', 'Inter', sans-serif",
    hierarchy: {
      display: { fontSize: '2.25rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 },
      pageTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3 },
      sectionTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#E2E8F0', lineHeight: 1.4 },
      cardTitle: { fontSize: '1.125rem', fontWeight: 600, color: '#F8FAFC', lineHeight: 1.4 },
      formLabel: { fontSize: '0.875rem', fontWeight: 500, color: '#CBD5E1', marginBottom: '8px' },
      inputValue: { fontSize: '0.875rem', fontWeight: 400, color: '#F8FAFC' },
      body: { fontSize: '1rem', fontWeight: 400, color: '#E2E8F0', lineHeight: 1.75 },
      caption: { fontSize: '0.8125rem', fontWeight: 400, color: '#94A3B8' },
      helper: { fontSize: '0.75rem', fontWeight: 400, color: '#94A3B8' },
      status: { fontSize: '0.75rem', fontWeight: 700 },
    },
    scale: {
      display: '2.25rem',   // 36px
      h1: '1.75rem',       // 28px
      h2: '1.5rem',        // 24px
      h3: '1.25rem',       // 20px
      sectionTitle: '1.25rem', // 20px
      cardTitle: '1.125rem',   // 18px
      body: '1rem',        // 16px
      label: '0.875rem',   // 14px
      small: '0.875rem',   // 14px
      caption: '0.8125rem' // 13px
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
  },

  borderRadius: {
    card: '20px',
    control: '12px',
    pill: '9999px',
    sm: '8px',
    lg: '24px',
  },

  shadows: {
    glass: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
    glassHover: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(59, 130, 246, 0.25)',
    glowPrimary: '0 0 25px rgba(59, 130, 246, 0.35)',
    glowAccent: '0 0 25px rgba(34, 197, 94, 0.35)',
  },

  statusColors: {
    success: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' },
    danger: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  },
};
