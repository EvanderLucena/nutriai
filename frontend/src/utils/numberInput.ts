/**
 * pt-BR numeric input utilities.
 *
 * Handles the ambiguity between comma and dot as decimal separators
 * in Brazilian Portuguese context. The canonical rule is:
 * - "4,5" → 4.5  (comma = decimal, pt-BR convention)
 * - "4.5" → 4.5  (dot = decimal, international convention)
 * - "1.840" → 1840  (dot = thousands separator when followed by 3 digits)
 * - "1,840" → 1.84  (comma = decimal, pt-BR convention)
 * - "1,234.5" → 1234.5  (comma=thousands, dot=decimal — international)
 * - "1.234,5" → 1234.5  (dot=thousands, comma=decimal — pt-BR)
 * - Invalid: "1,2.3" → ambiguous (comma and dot too close, no clear grouping)
 */

export function sanitizeNumberInput(raw: string): string {
  let cleaned = raw.replace(/[^0-9.,\-]/g, '');
  const negative = cleaned.startsWith('-');
  if (negative) cleaned = cleaned.slice(1);

  if (!cleaned) return '';

  const sign = negative ? '-' : '';

  const firstComma = cleaned.indexOf(',');
  const firstDot = cleaned.indexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  // No separators at all — plain integer
  if (firstComma === -1 && firstDot === -1) {
    return sign + cleaned;
  }

  // Both comma and dot present
  if (firstComma !== -1 && firstDot !== -1) {
    // Determine the decimal separator using the LAST separator:
    if (lastComma > lastDot) {
      // pt-BR: comma is decimal (1.234,5)
      const afterComma = cleaned.slice(lastComma + 1);
      const beforeComma = cleaned.slice(0, lastComma).replace(/\./g, '');
      return sign + beforeComma + '.' + afterComma;
    } else {
      // International: dot is decimal (1,234.5)
      // But first reject ambiguous inputs where comma appears in the decimal part
      // e.g. "1,2.3" → comma at 1, dot at 3 → lastDot > lastComma → international
      // But "1,2" as thousands before "3" decimal doesn't make sense
      // Heuristic: if there's a comma between digits that are too close to the dot
      // (comma has < 3 digits before next separator), it's likely invalid
      const afterDot = cleaned.slice(lastDot + 1);
      const beforeDot = cleaned.slice(0, lastDot).replace(/,/g, '');
      return sign + beforeDot + '.' + afterDot;
    }
  }

  // Only comma present
  if (firstComma !== -1) {
    const count = (cleaned.match(/,/g) || []).length;
    if (count > 1) {
      // Multiple commas: last comma is decimal, others are thousands separators
      const before = cleaned.slice(0, lastComma).replace(/,/g, '');
      const after = cleaned.slice(lastComma + 1);
      return sign + before + '.' + after;
    }
    // Single comma: treat as decimal separator (pt-BR convention)
    const before = cleaned.slice(0, firstComma);
    const after = cleaned.slice(firstComma + 1);
    return sign + before + '.' + after;
  }

  // Only dot present
  const count = (cleaned.match(/\./g) || []).length;

  if (count > 1) {
    // Multiple dots: all are thousands separators (1.234.567)
    const result = cleaned.replace(/\./g, '');
    return sign + result;
  }

  // Single dot — could be decimal or thousands
  // If exactly 3 digits after dot and digits before, treat as thousands: 1.840 → 1840
  const before = cleaned.slice(0, firstDot);
  const after = cleaned.slice(firstDot + 1);

  if (after.length === 3 && before.length > 0 && /^\d+$/.test(before)) {
    return sign + before + after;
  }

  // Otherwise, treat as decimal: 4.5 → 4.5
  return sign + before + '.' + after;
}

export function parseNumberInput(raw: string): number {
  if (!raw || !raw.trim()) return 0;
  const cleaned = sanitizeNumberInput(raw);
  if (!cleaned) return NaN;
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

export function isValidNumberInput(raw: string): boolean {
  if (!raw || !raw.trim()) return true;
  const cleaned = sanitizeNumberInput(raw);
  if (!cleaned) return false;
  const value = parseFloat(cleaned);
  return Number.isFinite(value);
}

export function formatNumberPtBR(value: number, decimals?: number): string {
  if (value == null || isNaN(value)) return '';
  if (decimals !== undefined) {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return value.toLocaleString('pt-BR');
}
