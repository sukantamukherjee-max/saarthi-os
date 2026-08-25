import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { snapshotPortfolio } from '../lib/snapshotPortfolio';
import type { Holding } from '../financial/types';

export interface RefreshResult {
  updated: number;
  skipped: { name: string; reason: string }[];
}

// Common coin names -> CoinGecko ids. Only covers a small, well-known set —
// anything else is honestly reported as "no id known" rather than guessed.
const COINGECKO_IDS: Record<string, string> = {
  bitcoin: 'bitcoin', btc: 'bitcoin',
  ethereum: 'ethereum', eth: 'ethereum',
  solana: 'solana', sol: 'solana',
  cardano: 'cardano', ada: 'cardano',
  ripple: 'ripple', xrp: 'ripple',
  dogecoin: 'dogecoin', doge: 'dogecoin',
};

function coingeckoId(name: string): string | null {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  for (const k of Object.keys(COINGECKO_IDS)) {
    if (key.includes(k)) return COINGECKO_IDS[k];
  }
  return null;
}

function parseQty(label: string): number | null {
  const n = Number(String(label || '').replace(/[,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function loadFx(): Promise<{ OMR_INR?: number; OMR_USD?: number }> {
  try {
    const res = await fetch('/.netlify/functions/fx-rates');
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

function toOMR(value: number, currency: string, fx: { OMR_INR?: number; OMR_USD?: number }): number | null {
  const ccy = (currency || 'OMR').toUpperCase();
  if (ccy === 'OMR') return value;
  if (ccy === 'INR' && fx.OMR_INR) return value / fx.OMR_INR;
  if (ccy === 'USD' && fx.OMR_USD) return value / fx.OMR_USD;
  return null;
}

/**
 * Refreshes current_value_omr for holdings we can actually get a live price
 * for: US Equity via Finnhub, Crypto via CoinGecko, Indian Equity via an
 * unofficial Yahoo Finance endpoint (resolving a ticker from the company
 * name first if none was captured). Anything we can't confidently price is
 * left untouched and reported back with a reason — never silently guessed.
 */
export function usePriceRefresh(userId: string | null) {
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<RefreshResult | null>(null);

  const refreshAll = useCallback(async (holdings: Holding[]) => {
    if (!userId) return;
    setRefreshing(true);
    setResult(null);
    const skipped: { name: string; reason: string }[] = [];
    const real = holdings.filter((h) => !h.isDemo && h.id);

    // Resolve any missing Indian Equity tickers via Yahoo's search endpoint first.
    const resolved = new Map<string, string>();
    for (const h of real) {
      if (h.c !== 'Indian Equity' || h.ticker) continue;
      try {
        const res = await fetch('/.netlify/functions/resolve-symbol', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: h.n, exchangeSuffix: '.NS' }),
        });
        const data = await res.json();
        if (data.symbol) {
          resolved.set(h.id!, data.symbol);
          await supabase.from('holdings').update({ ticker: data.symbol }).eq('id', h.id);
        } else {
          skipped.push({ name: h.n, reason: 'Could not match an NSE ticker for this name — add one manually via Edit.' });
        }
      } catch {
        skipped.push({ name: h.n, reason: 'Symbol lookup failed.' });
      }
    }

    interface Req { symbol: string; source: string; holding: Holding; qty: number; ccy: string }
    const requests: Req[] = [];
    for (const h of real) {
      const qty = parseQty(h.q);
      if (h.c === 'US Equity') {
        if (!h.ticker) { skipped.push({ name: h.n, reason: 'No ticker was captured from the upload.' }); continue; }
        if (qty == null) { skipped.push({ name: h.n, reason: 'Quantity is not a plain number.' }); continue; }
        requests.push({ symbol: h.ticker, source: 'finnhub', holding: h, qty, ccy: 'USD' });
      } else if (h.c === 'Indian Equity') {
        const ticker = h.ticker || resolved.get(h.id!);
        if (!ticker || qty == null) continue; // reason already logged, or logged below
        requests.push({ symbol: ticker, source: 'yahoo', holding: h, qty, ccy: 'INR' });
      } else if (h.c === 'Crypto') {
        const id = coingeckoId(h.n);
        if (!id) { skipped.push({ name: h.n, reason: 'No CoinGecko id known for this coin.' }); continue; }
        if (qty == null) { skipped.push({ name: h.n, reason: 'Quantity is not a plain number.' }); continue; }
        requests.push({ symbol: id, source: 'coingecko', holding: h, qty, ccy: 'USD' });
      }
    }

    if (!requests.length) {
      const final = { updated: 0, skipped };
      setRefreshing(false);
      setResult(final);
      return final;
    }

    const fx = await loadFx();
    const res = await fetch('/.netlify/functions/market-quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: requests.map((r) => ({ symbol: r.symbol, source: r.source })) }),
    });
    const data = await res.json().catch(() => ({}));
    const quotes = data.quotes || {};

    let updated = 0;
    for (const r of requests) {
      const q = quotes[r.symbol];
      if (!q || q.error) { skipped.push({ name: r.holding.n, reason: q?.error || 'No quote returned.' }); continue; }
      const valueOMR = toOMR(q.price * r.qty, q.currency || r.ccy, fx);
      if (valueOMR == null) { skipped.push({ name: r.holding.n, reason: `No live FX rate available for ${q.currency || r.ccy}.` }); continue; }
      await supabase.from('holdings').update({
        current_value_omr: valueOMR, price_source: 'live', last_priced_at: new Date().toISOString(),
      }).eq('id', r.holding.id);
      updated++;
    }

    if (updated > 0) await snapshotPortfolio(userId);

    const final = { updated, skipped };
    setRefreshing(false);
    setResult(final);
    return final;
  }, [userId]);

  return { refreshing, result, refreshAll };
}
