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
 * - Invalid: "1,2.3" → rejected (mixed separators too close, ambiguous)
 * - Invalid: "1..2" → rejected (consecutive dots)
 * - Invalid: "abc" → rejected (no digits)
 */

export function sanitizeNumberInput(raw: string): string {
  let cleaned = raw.replace(/[^0-9.,-]/g, '');
  const negative = cleaned.startsWith('-');
  if (negative) cleaned = cleaned.slice(1);
  if (cleaned.includes('-')) return '';

  if (!cleaned) return '';

  const sign = negative ? '-' : '';

  const firstComma = cleaned.indexOf(',');
  const lastComma = cleaned.lastIndexOf(',');
  const firstDot = cleaned.indexOf('.');
  const lastDot = cleaned.lastIndexOf('.');
  const commaCount = (cleaned.match(/,/g) || []).length;
  const dotCount = (cleaned.match(/\./g) || []).length;

  if (firstComma === -1 && firstDot === -1) {
    return sign + cleaned;
  }

  if (firstComma !== -1 && firstDot !== -1) {
    if (lastComma > lastDot) {
      if (cleaned.slice(0, lastComma).includes(',')) return '';
      const afterComma = cleaned.slice(lastComma + 1);
      const beforeComma = cleaned.slice(0, lastComma).replace(/\./g, '');
      return sign + beforeComma + '.' + afterComma;
    } else {
      if (cleaned.slice(0, lastDot).includes('.')) return '';
      const afterDot = cleaned.slice(lastDot + 1);
      const beforeDot = cleaned.slice(0, lastDot).replace(/,/g, '');
      return sign + beforeDot + '.' + afterDot;
    }
  }

  if (firstComma !== -1) {
    if (commaCount > 1) return '';
    const before = cleaned.slice(0, firstComma);
    const after = cleaned.slice(firstComma + 1);
    return sign + before + '.' + after;
  }

  if (dotCount > 1) {
    const chunks = cleaned.split('.');
    if (chunks.some((c) => c === '')) return '';

    const firstChunk = chunks[0];
    const middleChunks = chunks.slice(1, -1);
    const lastChunk = chunks[chunks.length - 1];

    const firstOk = /^\d{1,3}$/.test(firstChunk);
    const middleOk = middleChunks.every((c) => /^\d{3}$/.test(c));

    if (firstOk && middleOk && /^\d{3}$/.test(lastChunk)) {
      return sign + cleaned.replace(/\./g, '');
    }

    if (firstOk && middleOk && /^\d{0,3}$/.test(lastChunk) && lastChunk.length > 0) {
      const whole = chunks.slice(0, -1).join('');
      return sign + whole + '.' + lastChunk;
    }

    return '';
  }

  const before = cleaned.slice(0, firstDot);
  const after = cleaned.slice(firstDot + 1);

  if (after.length === 3 && before.length > 0 && /^\d+$/.test(before) && before !== '0') {
    return sign + before + after;
  }

  return sign + before + '.' + after;
}

export function isValidNumberInput(raw: string): boolean {
  if (!raw || !raw.trim()) return true;
  const trimmed = raw.trim();

  if (/[^0-9.,-]/.test(trimmed)) return false;

  const digitOnly = trimmed.replace(/[^0-9]/g, '');
  if (digitOnly.length === 0) return false;

  const minusCount = (trimmed.match(/-/g) || []).length;
  if (minusCount > 1 || (minusCount === 1 && !trimmed.startsWith('-'))) return false;

  if (/\.\./.test(trimmed) || /,,/.test(trimmed)) return false;

  if (/,\./.test(trimmed) || /\.,/.test(trimmed)) return false;

  const dotCount = (trimmed.match(/\./g) || []).length;
  const commaCount = (trimmed.match(/,/g) || []).length;

  if (dotCount > 1 && commaCount > 0) return false;
  if (commaCount > 1 && dotCount === 0) return false;

  if (dotCount === 1 && commaCount === 1) {
    const di = trimmed.indexOf('.');
    const ci = trimmed.indexOf(',');
    if (Math.abs(di - ci) === 1 || Math.abs(di - ci) === 2) {
      const digitsBetweenSections = trimmed
        .slice(Math.min(di, ci) + 1, Math.max(di, ci))
        .replace(/[^0-9]/g, '');
      if (digitsBetweenSections.length <= 1) return false;
    }
  }

  const sanitized = sanitizeNumberInput(trimmed);
  if (!sanitized) return false;
  const value = parseFloat(sanitized);
  return Number.isFinite(value);
}

export function parseNumberInput(raw: string): number {
  if (!raw || !raw.trim()) return 0;
  if (!isValidNumberInput(raw)) return NaN;
  const cleaned = sanitizeNumberInput(raw);
  if (!cleaned) return NaN;
  return parseFloat(cleaned);
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
