import { callGemini, extractJson } from './_lib/gemini.js';

// POST /.netlify/functions/parse-statement
// Body: { fileBase64, mimeType, filename }
// Extracts holdings from a PDF statement or portfolio screenshot via Gemini
// vision. Never guesses: unclear fields come back null with a reason in
// needsReview, for the client to surface on the Upload screen.
const MAX_B64_CHARS = 6 * 1024 * 1024 * 1.4; // ~6MB decoded, base64 inflates ~1.37x

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  const { fileBase64, mimeType, filename } = payload;
  if (!fileBase64 || !mimeType) {
    return { statusCode: 400, body: JSON.stringify({ error: 'fileBase64 and mimeType are required' }) };
  }
  if (fileBase64.length > MAX_B64_CHARS) {
    return { statusCode: 413, body: JSON.stringify({ error: 'File too large for inline parsing (try under ~4MB)' }) };
  }

  const prompt = `You are extracting holdings from a financial statement or portfolio screenshot named "${filename || 'upload'}".
Return ONLY JSON, no prose, matching this exact shape:
{"holdings":[{"name":string,"assetClass":"Indian Equity"|"US Equity"|"Crypto"|"Liquid Fund"|"Cash"|"Gold"|"Other","quantityLabel":string,"currentValueOMR":number|null,"currency":string,"confidence":"High"|"Medium"|"Low","note":string}],"needsReview":[{"field":string,"why":string}]}
Rules:
- Never invent a number you cannot actually read in the document. If a value is unclear or ambiguous, set it to null and explain why in "needsReview".
- currentValueOMR should be your best-effort conversion to Omani Rial if the source currency is stated in the document; otherwise null.
- If the document has no readable holdings at all, return {"holdings":[],"needsReview":[{"field":"document","why":"<reason>"}]}.`;

  try {
    const text = await callGemini(
      [{ text: prompt }, { inlineData: { mimeType, data: fileBase64 } }],
      { jsonMode: true }
    );
    const parsed = extractJson(text);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e?.message || e) }) };
  }
}
