/**
 * Sistema Responsive per Craft.js Editor
 * Gestisce breakpoints e stili responsive automatici
 */

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Converte valori CSS in responsive
 */
export function getResponsiveValue(
  value: number | string,
  device: DeviceType = 'desktop',
  scale: { mobile?: number; tablet?: number; desktop?: number; wide?: number } = {}
): string | number {
  if (typeof value === 'string') return value;

  const scales = {
    mobile: scale.mobile ?? 0.6,
    tablet: scale.tablet ?? 0.8,
    desktop: scale.desktop ?? 1,
    wide: scale.wide ?? 1.1,
  };

  return Math.round(value * scales[device]);
}

/**
 * Genera media query CSS per responsive
 */
export function generateMediaQueries(styles: Record<string, any>) {
  return `
    /* Desktop (default) */
    ${Object.entries(styles.desktop || {})
      .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
      .join('\n    ')}

    /* Tablet */
    @media (max-width: ${BREAKPOINTS.desktop}px) {
      ${Object.entries(styles.tablet || {})
        .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
        .join('\n      ')}
    }

    /* Mobile */
    @media (max-width: ${BREAKPOINTS.tablet}px) {
      ${Object.entries(styles.mobile || {})
        .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
        .join('\n      ')}
    }
  `;
}

/**
 * Converte camelCase in kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Hook-like function per ottenere il device corrente
 */
export function getCurrentDevice(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;

  if (width <= BREAKPOINTS.mobile) return 'mobile';
  if (width <= BREAKPOINTS.tablet) return 'tablet';
  if (width <= BREAKPOINTS.desktop) return 'desktop';
  return 'wide';
}

/**
 * Calcola padding/margin responsive
 */
export function getResponsivePadding(
  basePadding: number,
  device?: DeviceType
): number {
  const currentDevice = device || getCurrentDevice();

  switch (currentDevice) {
    case 'mobile':
      return Math.max(Math.round(basePadding * 0.5), 10); // Min 10px
    case 'tablet':
      return Math.round(basePadding * 0.75);
    case 'desktop':
      return basePadding;
    case 'wide':
      return Math.round(basePadding * 1.1);
    default:
      return basePadding;
  }
}

/**
 * Calcola font size responsive
 */
export function getResponsiveFontSize(
  baseFontSize: number,
  device?: DeviceType
): number {
  const currentDevice = device || getCurrentDevice();

  switch (currentDevice) {
    case 'mobile':
      return Math.max(Math.round(baseFontSize * 0.7), 14); // Min 14px
    case 'tablet':
      return Math.round(baseFontSize * 0.85);
    case 'desktop':
      return baseFontSize;
    case 'wide':
      return Math.round(baseFontSize * 1.05);
    default:
      return baseFontSize;
  }
}

/**
 * Genera stili responsive inline per React
 */
export function getResponsiveStyles(baseStyles: React.CSSProperties): React.CSSProperties {
  const device = getCurrentDevice();
  const responsiveStyles = { ...baseStyles };

  // Padding responsive
  if (baseStyles.padding) {
    const padding = parseInt(baseStyles.padding as string);
    responsiveStyles.padding = `${getResponsivePadding(padding, device)}px`;
  }

  // Font size responsive
  if (baseStyles.fontSize) {
    const fontSize = parseInt(baseStyles.fontSize as string);
    responsiveStyles.fontSize = `${getResponsiveFontSize(fontSize, device)}px`;
  }

  // Min height responsive
  if (baseStyles.minHeight) {
    const minHeight = parseInt(baseStyles.minHeight as string);
    if (device === 'mobile') {
      responsiveStyles.minHeight = `${Math.round(minHeight * 0.6)}px`;
    } else if (device === 'tablet') {
      responsiveStyles.minHeight = `${Math.round(minHeight * 0.8)}px`;
    }
  }

  return responsiveStyles;
}
