/**
 * OMNILY PRO - Design System Utilities
 * Utilities per applicare il design system uniforme
 */

// Mapping colori legacy -> variabili design system
export const COLOR_MAPPING = {
  // Primari
  '#3b82f6': 'var(--omnily-primary)',
  '#2563eb': 'var(--omnily-primary-dark)',
  '#60a5fa': 'var(--omnily-primary-light)',
  '#1e40af': 'var(--omnily-primary)',
  '#1d4ed8': 'var(--omnily-primary-dark)',
  '#1e3a8a': 'var(--omnily-primary-dark)',

  // Grigi
  '#f8fafc': 'var(--omnily-gray-50)',
  '#f1f5f9': 'var(--omnily-gray-100)',
  '#e2e8f0': 'var(--omnily-border-color)',
  '#cbd5e1': 'var(--omnily-gray-300)',
  '#94a3b8': 'var(--omnily-gray-400)',
  '#64748b': 'var(--omnily-gray-500)',
  '#475569': 'var(--omnily-gray-600)',
  '#334155': 'var(--omnily-gray-700)',
  '#1e293b': 'var(--omnily-gray-800)',
  '#0f172a': 'var(--omnily-gray-900)',

  // Stati
  '#10b981': 'var(--omnily-success)',
  '#22c55e': 'var(--omnily-success)',
  '#34d399': 'var(--omnily-success-light)',
  '#f0fdf4': 'var(--omnily-success-bg)',
  '#ecfdf5': 'var(--omnily-success-bg)',
  '#dcfce7': 'var(--omnily-success-bg)',

  '#f59e0b': 'var(--omnily-warning)',
  '#fbbf24': 'var(--omnily-warning-light)',
  '#d97706': 'var(--omnily-warning)',
  '#fffbeb': 'var(--omnily-warning-bg)',
  '#fef3c7': 'var(--omnily-warning-bg)',

  '#ef4444': 'var(--omnily-error)',
  '#f87171': 'var(--omnily-error-light)',
  '#dc2626': 'var(--omnily-error)',
  '#fef2f2': 'var(--omnily-error-bg)',
  '#fed7d7': 'var(--omnily-error-bg)',

  '#06b6d4': 'var(--omnily-info)',
  '#22d3ee': 'var(--omnily-info-light)',
  '#0891b2': 'var(--omnily-info)',
  '#f0fdff': 'var(--omnily-info-bg)',
  '#e0f7fa': 'var(--omnily-info-bg)',

  // Testi
  '#374151': 'var(--omnily-gray-700)',
  '#111827': 'var(--omnily-gray-900)',
  '#6b7280': 'var(--omnily-gray-500)',
  '#9ca3af': 'var(--omnily-gray-400)',
  '#d1d5db': 'var(--omnily-border-color)',

  // Altri colori comuni
  '#ffffff': '#ffffff',
  'white': 'white',
  'transparent': 'transparent'
}

// Classi CSS unificate
export const UNIFIED_CLASSES = {
  // Bottoni
  'btn-primary': 'omnily-btn omnily-btn-primary',
  'btn-secondary': 'omnily-btn omnily-btn-secondary',
  'btn-success': 'omnily-btn omnily-btn-success',
  'btn-warning': 'omnily-btn omnily-btn-warning',
  'btn-error': 'omnily-btn omnily-btn-error',

  // Cards
  'stat-card': 'omnily-stat-card',
  'card': 'omnily-card',

  // Status badges
  'status-badge': 'omnily-status-badge',

  // Form elements
  'form-input': 'omnily-input',
  'form-select': 'omnily-input',
  'form-textarea': 'omnily-input',

  // Layout
  'dashboard-header': 'omnily-dashboard-header',
  'dashboard-section': 'omnily-dashboard-section',
  'stats-grid': 'omnily-stats-grid',
  'tabs': 'omnily-tabs',
  'tab': 'omnily-tab'
}

/**
 * Converte un colore hex/rgb in variabile del design system
 */
export const convertColor = (color: string): string => {
  const normalized = color.toLowerCase().trim()
  return COLOR_MAPPING[normalized as keyof typeof COLOR_MAPPING] || color
}

/**
 * Converte un oggetto di stili sostituendo i colori
 */
export const convertStyles = (styles: Record<string, any>): Record<string, any> => {
  const converted = { ...styles }

  Object.keys(converted).forEach(key => {
    if (typeof converted[key] === 'string') {
      // Controlla se è un colore
      if (converted[key].match(/^#[0-9a-f]{3,6}$/i) ||
          converted[key].match(/^rgb\(/) ||
          COLOR_MAPPING[converted[key] as keyof typeof COLOR_MAPPING]) {
        converted[key] = convertColor(converted[key])
      }
    }
  })

  return converted
}

/**
 * Stili unificati per componenti comuni
 */
export const UNIFIED_STYLES = {
  // Dashboard header
  dashboardHeader: {
    background: 'white',
    borderBottom: '1px solid var(--omnily-border-color)',
    padding: 'var(--omnily-spacing-6)',
    margin: 0,
    width: '100%'
  },

  // Dashboard section
  dashboardSection: {
    background: 'var(--omnily-gray-50)',
    padding: 'var(--omnily-spacing-6)',
    margin: 0,
    width: '100%'
  },

  // Stat card
  statCard: {
    background: 'white',
    borderRadius: 'var(--omnily-border-radius-lg)',
    border: '1px solid var(--omnily-border-color)',
    padding: 'var(--omnily-spacing-6)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--omnily-spacing-4)',
    transition: 'all 0.2s'
  },

  // Button primary
  buttonPrimary: {
    background: 'var(--omnily-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--omnily-border-radius)',
    padding: 'var(--omnily-spacing-3) var(--omnily-spacing-6)',
    fontSize: 'var(--omnily-font-size-sm)',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--omnily-spacing-2)',
    transition: 'all 0.2s'
  },

  // Button secondary
  buttonSecondary: {
    background: 'var(--omnily-gray-50)',
    color: 'var(--omnily-gray-700)',
    border: '1px solid var(--omnily-border-color)',
    borderRadius: 'var(--omnily-border-radius)',
    padding: 'var(--omnily-spacing-3) var(--omnily-spacing-6)',
    fontSize: 'var(--omnily-font-size-sm)',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--omnily-spacing-2)',
    transition: 'all 0.2s'
  },

  // Input
  input: {
    width: '100%',
    padding: 'var(--omnily-spacing-3)',
    border: '1px solid var(--omnily-border-color)',
    borderRadius: 'var(--omnily-border-radius)',
    fontSize: 'var(--omnily-font-size-sm)',
    fontFamily: 'var(--omnily-font-family)',
    transition: 'border-color 0.2s'
  },

  // Card
  card: {
    background: 'white',
    borderRadius: 'var(--omnily-border-radius-lg)',
    border: '1px solid var(--omnily-border-color)',
    boxShadow: 'var(--omnily-shadow-sm)',
    padding: 'var(--omnily-spacing-6)',
    transition: 'all 0.2s'
  }
}

/**
 * Status badge props unificati
 */
export const getStatusBadgeStyle = (status: string) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--omnily-spacing-1)',
    padding: 'var(--omnily-spacing-1) var(--omnily-spacing-3)',
    borderRadius: 'var(--omnily-border-radius)',
    fontSize: 'var(--omnily-font-size-xs)',
    fontWeight: '600',
    textTransform: 'uppercase' as const
  }

  switch (status.toLowerCase()) {
    case 'online':
    case 'active':
    case 'success':
    case 'completed':
    case 'paid':
      return {
        ...baseStyle,
        backgroundColor: 'var(--omnily-success-bg)',
        color: 'var(--omnily-success)'
      }

    case 'offline':
    case 'error':
    case 'failed':
    case 'cancelled':
      return {
        ...baseStyle,
        backgroundColor: 'var(--omnily-error-bg)',
        color: 'var(--omnily-error)'
      }

    case 'pending':
    case 'warning':
    case 'in_progress':
      return {
        ...baseStyle,
        backgroundColor: 'var(--omnily-warning-bg)',
        color: 'var(--omnily-warning)'
      }

    case 'info':
    case 'draft':
      return {
        ...baseStyle,
        backgroundColor: 'var(--omnily-info-bg)',
        color: 'var(--omnily-info)'
      }

    default:
      return {
        ...baseStyle,
        backgroundColor: 'var(--omnily-gray-100)',
        color: 'var(--omnily-gray-600)'
      }
  }
}

/**
 * Icona con colore unificato per status
 */
export const getStatusIconStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'online':
    case 'active':
    case 'success':
      return { color: 'var(--omnily-success)' }

    case 'offline':
    case 'error':
    case 'failed':
      return { color: 'var(--omnily-error)' }

    case 'pending':
    case 'warning':
      return { color: 'var(--omnily-warning)' }

    case 'info':
      return { color: 'var(--omnily-info)' }

    default:
      return { color: 'var(--omnily-primary)' }
  }
}