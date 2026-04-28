import { describe, it, expect } from 'vitest';
import {
  sanitizeNumberInput,
  parseNumberInput,
  isValidNumberInput,
  formatNumberPtBR,
} from './numberInput';

describe('sanitizeNumberInput', () => {
  it('handles plain integers', () => {
    expect(sanitizeNumberInput('42')).toBe('42');
  });

  it('handles pt-BR comma as decimal', () => {
    expect(sanitizeNumberInput('4,5')).toBe('4.5');
  });

  it('handles international dot as decimal', () => {
    expect(sanitizeNumberInput('4.5')).toBe('4.5');
  });

  it('treats dot as thousands separator when followed by 3 digits (1.840 → 1840)', () => {
    expect(sanitizeNumberInput('1.840')).toBe('1840');
  });

  it('treats comma as decimal with 3 decimal digits (1,840 → 1.840 numeric = 1.84)', () => {
    // Comma is the decimal separator in pt-BR, so 1,840 → 1.840 (which equals 1.84)
    expect(sanitizeNumberInput('1,840')).toBe('1.840');
  });

  it('handles pt-BR thousands: 1.234,5 → 1234.5', () => {
    expect(sanitizeNumberInput('1.234,5')).toBe('1234.5');
  });

  it('handles international thousands: 1,234.5 → 1234.5', () => {
    expect(sanitizeNumberInput('1,234.5')).toBe('1234.5');
  });

  it('last-separator rule: 1,2.3 interprets as international → 12.3', () => {
    expect(sanitizeNumberInput('1,2.3')).toBe('12.3');
  });

  it('handles negative numbers', () => {
    expect(sanitizeNumberInput('-4,5')).toBe('-4.5');
  });

  it('strips non-numeric characters', () => {
    expect(sanitizeNumberInput('abc12,3def')).toBe('12.3');
  });

  it('returns empty for all-non-numeric', () => {
    expect(sanitizeNumberInput('abc')).toBe('');
  });

  it('handles empty string', () => {
    expect(sanitizeNumberInput('')).toBe('');
  });

  it('handles zero', () => {
    expect(sanitizeNumberInput('0')).toBe('0');
  });

  it('handles leading zeros', () => {
    expect(sanitizeNumberInput('0,5')).toBe('0.5');
  });

  it('handles multiple commas (last is decimal)', () => {
    // 1,23,4 → last comma at index 4 is decimal, 123 before → 123.4
    expect(sanitizeNumberInput('1,23,4')).toBe('123.4');
  });

  it('handles multiple dots (international thousands)', () => {
    expect(sanitizeNumberInput('1.234.567')).toBe('1234567');
  });
});

describe('parseNumberInput', () => {
  it('parses pt-BR comma decimal', () => {
    expect(parseNumberInput('4,5')).toBe(4.5);
  });

  it('parses international dot decimal', () => {
    expect(parseNumberInput('4.5')).toBe(4.5);
  });

  it('parses pt-BR thousands with comma decimal', () => {
    expect(parseNumberInput('1.234,5')).toBe(1234.5);
  });

  it('parses international thousands with dot decimal', () => {
    expect(parseNumberInput('1,234.5')).toBe(1234.5);
  });

  it('treats 1.840 as 1840 (dot = thousands)', () => {
    expect(parseNumberInput('1.840')).toBe(1840);
  });

  it('treats 1,840 as 1.84 (comma = decimal)', () => {
    expect(parseNumberInput('1,840')).toBe(1.84);
  });

  it('returns 0 for empty string', () => {
    expect(parseNumberInput('')).toBe(0);
  });

  it('returns 0 for whitespace', () => {
    expect(parseNumberInput('   ')).toBe(0);
  });

  it('parses ambiguous 1,2.3 as 12.3', () => {
    expect(parseNumberInput('1,2.3')).toBe(12.3);
  });

  it('parses simple integer', () => {
    expect(parseNumberInput('42')).toBe(42);
  });

  it('parses negative number', () => {
    expect(parseNumberInput('-4,5')).toBe(-4.5);
  });
});

describe('isValidNumberInput', () => {
  it('returns true for valid number', () => {
    expect(isValidNumberInput('4,5')).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isValidNumberInput('')).toBe(true);
  });

  it('returns true for whitespace-only', () => {
    expect(isValidNumberInput('   ')).toBe(true);
  });

  it('returns true for 1,2.3 (parsable via last-separator rule)', () => {
    expect(isValidNumberInput('1,2.3')).toBe(true);
  });

  it('returns false for pure text', () => {
    expect(isValidNumberInput('abc')).toBe(false);
  });
});

describe('formatNumberPtBR', () => {
  it('formats integer with thousands separator', () => {
    expect(formatNumberPtBR(1840)).toBe('1.840');
  });

  it('formats decimal with comma', () => {
    expect(formatNumberPtBR(4.5)).toBe('4,5');
  });

  it('formats with fixed decimals', () => {
    expect(formatNumberPtBR(75, 2)).toBe('75,00');
  });

  it('formats with fractional precision', () => {
    expect(formatNumberPtBR(22.5, 1)).toBe('22,5');
  });

  it('returns empty for NaN', () => {
    expect(formatNumberPtBR(NaN)).toBe('');
  });

  it('returns empty for null', () => {
    expect(formatNumberPtBR(null as unknown as number)).toBe('');
  });

  it('formats zero', () => {
    expect(formatNumberPtBR(0)).toBe('0');
  });
});
