import { callGemini, extractJson } from './_lib/gemini.js';

// POST /.netlify/functions/narrate-recommendation
// Body: { items: [{ title, body, action, impact, risk, ... }], context: {...} }
// The rule-based engine already decided WHAT to recommend and computed every
// number — this only rewrites the "body" prose. Never allowed to introduce
// new figures; the client falls back to the original rule-based body on any
// failure, so this call is a progressive enhancement, never a dependency.
export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  const { items, context } = payload;
  if (!Array.isArray(items) || !items.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'items[] is required' }) };
  }

  const prompt = `You are a financial writing assistant. You are given recommendation objects already computed by a deterministic rule engine — every number in them is final and correct.
Your ONLY job: rewrite each item's "body" field into a natural, warm, personalized paragraph of financial-advisor prose, grounded strictly in the facts given. Do not introduce any new number, percentage, or amount that is not already present in the item or the context. Do not change "action", "title", "impact", or "risk".
Context about the plan: ${JSON.stringify(context || {})}
Items:
${JSON.stringify(items)}
Return ONLY JSON: {"items":[{"title":string,"body":string}]} in the same order as given, one entry per input item.`;

  try {
    const text = await callGemini([{ text: prompt }], { jsonMode: true });
    const parsed = extractJson(text);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e?.message || e) }) };
  }
}
