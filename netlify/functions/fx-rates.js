// GET /.netlify/functions/fx-rates
// Returns OMR→INR and OMR→USD rates. Server-side only: keeps EXCHANGERATE_API_KEY off the client.
export async function handler() {
  const key = process.env.EXCHANGERATE_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'EXCHANGERATE_API_KEY is not configured' }) };
  }
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/OMR`);
    const data = await res.json();
    if (data.result !== 'success') {
      return { statusCode: 502, body: JSON.stringify({ error: data['error-type'] || 'FX lookup failed' }) };
    }
    const rates = data.conversion_rates || {};
    const out = {
      OMR_INR: rates.INR ?? null,
      OMR_USD: rates.USD ?? null,
      fetchedAt: new Date().toISOString(),
    };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e?.message || e) }) };
  }
}
