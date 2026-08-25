// POST /.netlify/functions/resolve-symbol
// Body: { query, exchangeSuffix }  e.g. { query: "Bajaj Finance Limited", exchangeSuffix: ".NS" }
// Uses Yahoo Finance's unofficial, unauthenticated search endpoint to turn a company
// name into a tradeable ticker (e.g. "BAJFINANCE.NS") when no ticker was captured
// from the upload. Unsupported/undocumented API — used only because Finnhub's free
// tier does not cover NSE/BSE. Never invents a symbol: returns null if unmatched.
export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  const { query, exchangeSuffix } = payload;
  if (!query) return { statusCode: 400, body: JSON.stringify({ error: 'query is required' }) };

  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const data = await res.json();
    const quotes = Array.isArray(data?.quotes) ? data.quotes : [];
    const match = exchangeSuffix
      ? quotes.find((q) => typeof q.symbol === 'string' && q.symbol.endsWith(exchangeSuffix))
      : quotes[0];
    if (!match) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: null, reason: 'No matching symbol found' }) };
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: match.symbol, name: match.shortname || match.longname || null }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e?.message || e) }) };
  }
}
