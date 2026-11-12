import { describe, it, expect } from 'vitest';
import { CURRENCY_MAP, resolveCurrency } from '../currency';

describe('CURRENCY_MAP', () => {
  it('contains INR, USD, EUR, GBP', () => {
    expect(Object.keys(CURRENCY_MAP).sort()).toEqual([
      'EUR (€)', 'GBP (£)', 'INR (₹)', 'USD ($)',
    ]);
  });

  it('each entry has a symbol and code', () => {
    Object.values(CURRENCY_MAP).forEach(({ symbol, code }) => {
      expect(symbol).toBeTruthy();
      expect(code).toHaveLength(3);
    });
  });
});

describe('resolveCurrency', () => {
  it('resolves INR by exact key', () => {
    const info = resolveCurrency('INR (₹)');
    expect(info.symbol).toBe('₹');
    expect(info.code).toBe('INR');
  });

  it('resolves USD', () => {
    const info = resolveCurrency('USD ($)');
    expect(info.symbol).toBe('$');
    expect(info.code).toBe('USD');
  });

  it('resolves EUR', () => {
    const info = resolveCurrency('EUR (€)');
    expect(info.symbol).toBe('€');
    expect(info.code).toBe('EUR');
  });

  it('resolves GBP', () => {
    const info = resolveCurrency('GBP (£)');
    expect(info.symbol).toBe('£');
    expect(info.code).toBe('GBP');
  });

  it('falls back to INR for null/undefined/empty/unknown', () => {
    for (const input of [null, undefined, '', 'XYZ', 'AUD ($)']) {
      const info = resolveCurrency(input);
      expect(info.code).toBe('INR');
      expect(info.symbol).toBe('₹');
    }
  });

  it('format() produces symbol + locale string for a positive number', () => {
    const info = resolveCurrency('USD ($)');
    const formatted = info.format(1234567);
    // Should start with $ and include commas
    expect(formatted).toMatch(/^\$[\d,]+$/);
    expect(formatted).toContain('1,234,567');
  });

  it('format(0) returns symbol + "0"', () => {
    const info = resolveCurrency('INR (₹)');
    expect(info.format(0)).toMatch(/^₹0$/);
  });

  it('format handles negative amounts', () => {
    const info = resolveCurrency('EUR (€)');
    const result = info.format(-500);
    expect(result).toContain('€');
    expect(result).toContain('500');
  });
});
