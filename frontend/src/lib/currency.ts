import { useState, useEffect } from 'react';
import { api } from './api';

export interface CurrencyInfo {
  symbol: string;
  code: string;
  format: (amount: number) => string;
}

export const CURRENCY_MAP: Record<string, { symbol: string; code: string }> = {
  'INR (₹)': { symbol: '₹', code: 'INR' },
  'USD ($)': { symbol: '$', code: 'USD' },
  'EUR (€)': { symbol: '€', code: 'EUR' },
  'GBP (£)': { symbol: '£', code: 'GBP' },
};

export function resolveCurrency(raw: string | undefined | null): CurrencyInfo {
  const entry = CURRENCY_MAP[raw || ''] || CURRENCY_MAP['INR (₹)'];
  return {
    symbol: entry.symbol,
    code: entry.code,
    format: (amount: number) => `${entry.symbol}${amount.toLocaleString()}`,
  };
}

/**
 * Hook that fetches the gym-level currency preference from
 * `settings/app_preferences` and returns a formatter.
 * Falls back to INR (₹) on error or before the read resolves.
 */
export function useCurrency(): CurrencyInfo {
  const [info, setInfo] = useState<CurrencyInfo>(resolveCurrency(null));

  useEffect(() => {
    api<Record<string, unknown>>('/api/settings/app_preferences')
      .then(prefs => {
        const currency = prefs?.currency;
        setInfo(resolveCurrency(typeof currency === 'string' ? currency : null));
      })
      .catch(() => { /* use defaults */ });
  }, []);

  return info;
}
