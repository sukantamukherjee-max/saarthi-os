import { useCallback, useEffect, useState } from 'react';

// Free-tier proxies for the two indices we can actually reach: SPY/QQQ ETF
// prices via Finnhub track the S&P 500 / Nasdaq 100 closely enough to report
// as a live reference point. Nifty 50/500 have no equivalent free source
// wired into this app, so those stay "Data unavailable" rather than guessed.
const PROXIES: { label: string; symbol: string }[] = [
  { label: 'S&P 500', symbol: 'SPY' },
  { label: 'Nasdaq 100', symbol: 'QQQ' },
];

export function useBenchmarks() {
  const [quotes, setQuotes] = useState<Record<string, { price: number } | null>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/market-quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: PROXIES.map((p) => ({ symbol: p.symbol, source: 'finnhub' })) }),
      });
      const data = await res.json();
      const map: Record<string, { price: number } | null> = {};
      for (const p of PROXIES) {
        const q = data.quotes?.[p.symbol];
        map[p.label] = q && !q.error ? { price: q.price } : null;
      }
      setQuotes(map);
    } catch {
      setQuotes({});
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { quotes, loading, refresh };
}
