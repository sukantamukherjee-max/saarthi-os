// POST /.netlify/functions/market-quotes
// Body: { symbols: [{ symbol, source: 'finnhub' | 'coingecko' | 'mfapi' }] }
// Keeps FINNHUB_API_KEY server-side; CoinGecko and MFAPI need no key.
export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  const symbols = Array.isArray(payload.symbols) ? payload.symbols : [];
  const out = {};

  await Promise.all(symbols.map(async (s) => {
    try {
      if (s.source === 'finnhub') {
        const key = process.env.FINNHUB_API_KEY;
        if (!key) throw new Error('FINNHUB_API_KEY is not configured');
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s.symbol)}&token=${key}`);
        const data = await res.json();
        if (typeof data.c === 'number' && data.c > 0) out[s.symbol] = { price: data.c, currency: 'USD', source: 'finnhub' };
        else throw new Error('no quote returned');
      } else if (s.source === 'coingecko') {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(s.symbol)}&vs_currencies=usd`);
        const data = await res.json();
        const price = data?.[s.symbol]?.usd;
        if (typeof price === 'number') out[s.symbol] = { price, currency: 'USD', source: 'coingecko' };
        else throw new Error('no price returned');
      } else if (s.source === 'mfapi') {
        const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(s.symbol)}`);
        const data = await res.json();
        const nav = data?.data?.[0]?.nav;
        if (nav) out[s.symbol] = { price: Number(nav), currency: 'INR', source: 'mfapi' };
        else throw new Error('no NAV returned');
      } else {
        throw new Error(`unknown source "${s.source}"`);
      }
    } catch (e) {
      out[s.symbol] = { error: String(e?.message || e) };
    }
  }));

  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quotes: out, fetchedAt: new Date().toISOString() }) };
}
