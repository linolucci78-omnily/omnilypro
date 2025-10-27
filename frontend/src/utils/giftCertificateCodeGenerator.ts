/**
 * Gift Certificate Code Generator
 *
 * Utilities for generating unique gift certificate codes,
 * QR codes, and barcodes with anti-confusion character sets.
 */

import QRCode from 'qrcode';

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Character set without confusing characters (no I, O, 0, 1, l)
 * This prevents human error when manually entering codes
 */
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random string using safe character set
 */
function generateRandomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
    result += SAFE_CHARS[randomIndex];
  }
  return result;
}

/**
 * Generate a unique gift certificate code
 *
 * Format: PREFIX-XXXX-XXXX-XXXX
 * Example: GIFT-A8F9-K3L7-M2N4
 *
 * @param prefix - Code prefix (default: 'GIFT')
 * @param length - Total length of random part (default: 12, will be split into groups of 4)
 * @returns Formatted gift certificate code
 */
export function generateGiftCertificateCode(
  prefix: string = 'GIFT',
  length: number = 12
): string {
  const randomPart = generateRandomString(length);

  // Split into groups of 4 for readability
  const groups: string[] = [];
  for (let i = 0; i < randomPart.length; i += 4) {
    groups.push(randomPart.slice(i, i + 4));
  }

  return `${prefix}-${groups.join('-')}`;
}

/**
 * Validate gift certificate code format
 */
export function isValidCodeFormat(code: string): boolean {
  // Format: PREFIX-XXXX-XXXX-XXXX
  const pattern = /^[A-Z]+-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Format code with dashes for display
 */
export function formatCode(code: string): string {
  // Remove existing dashes and spaces
  const clean = code.replace(/[-\s]/g, '').toUpperCase();

  // Find prefix (letters before first number)
  const prefixMatch = clean.match(/^([A-Z]+)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const remaining = clean.slice(prefix.length);

  // Split remaining into groups of 4
  const groups = remaining.match(/.{1,4}/g) || [];

  return prefix ? `${prefix}-${groups.join('-')}` : groups.join('-');
}

// ============================================================================
// QR CODE GENERATION
// ============================================================================

export interface QRCodeOptions {
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate QR code for gift certificate
 *
 * The QR code contains JSON data with certificate information
 * for easy validation and redemption at POS
 */
export async function generateGiftCertificateQRCode(
  code: string,
  organizationId: string,
  amount?: number,
  options: QRCodeOptions = {}
): Promise<string> {
  const qrData = {
    type: 'gift_certificate',
    code,
    organizationId,
    amount,
    timestamp: new Date().toISOString()
  };

  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    type: 'image/png' as const,
    quality: 1,
    margin: options.margin || 2,
    width: options.size || 300,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    }
  };

  try {
    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData), qrOptions);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parse QR code data
 */
export function parseQRCodeData(qrData: string): {
  type: string;
  code: string;
  organizationId: string;
  amount?: number;
  timestamp: string;
} | null {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.type === 'gift_certificate' && parsed.code) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
}

// ============================================================================
// BARCODE GENERATION
// ============================================================================

/**
 * Generate numeric barcode for gift certificate
 *
 * Uses EAN-13 compatible format (13 digits)
 * Format: OOOOOOOOCCCC where:
 * - OOOOOOOO = Organization ID (first 8 digits of UUID hash)
 * - CCCC = Certificate sequential number
 */
export function generateBarcode(
  organizationId: string,
  sequentialNumber: number
): string {
  // Get first 8 digits from organization ID hash
  const orgHash = hashString(organizationId).toString().slice(0, 8);

  // Pad sequential number to 4 digits
  const seqPadded = sequentialNumber.toString().padStart(4, '0');

  // Combine to create 12 digit code
  const code12 = orgHash + seqPadded;

  // Calculate EAN-13 check digit
  const checkDigit = calculateEAN13CheckDigit(code12);

  return code12 + checkDigit;
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate EAN-13 check digit
 */
function calculateEAN13CheckDigit(code: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Validate EAN-13 barcode
 */
export function isValidBarcode(barcode: string): boolean {
  if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
    return false;
  }

  const code12 = barcode.slice(0, 12);
  const providedCheckDigit = barcode[12];
  const calculatedCheckDigit = calculateEAN13CheckDigit(code12);

  return providedCheckDigit === calculatedCheckDigit;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a code is potentially fraudulent based on patterns
 */
export function detectFraudulentCode(code: string): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check for sequential characters
  if (/(.)\1{3,}/.test(code.replace(/-/g, ''))) {
    reasons.push('Contains too many sequential identical characters');
  }

  // Check for obvious patterns
  const clean = code.replace(/-/g, '');
  if (
    /^(012|123|234|345|456|567|678|789|ABC|BCD|CDE|DEF)/.test(clean) ||
    /^(AAA|BBB|CCC|DDD|EEE|FFF)/.test(clean)
  ) {
    reasons.push('Contains sequential pattern');
  }

  // Check length
  if (clean.length < 8) {
    reasons.push('Code too short');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons
  };
}

/**
 * Sanitize code input (remove special chars, convert to uppercase)
 */
export function sanitizeCodeInput(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .trim();
}

/**
 * Generate multiple unique codes at once
 */
export function generateBulkCodes(
  count: number,
  prefix: string = 'GIFT'
): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    const code = generateGiftCertificateCode(prefix);
    codes.add(code);
  }

  return Array.from(codes);
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export default {
  generateGiftCertificateCode,
  generateGiftCertificateQRCode,
  generateBarcode,
  isValidCodeFormat,
  isValidBarcode,
  formatCode,
  parseQRCodeData,
  detectFraudulentCode,
  sanitizeCodeInput,
  generateBulkCodes
};
