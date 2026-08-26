const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

/**
 * Calls Gemini's generateContent endpoint. `parts` follows Gemini's content
 * part shape: [{ text }, { inlineData: { mimeType, data } }, ...].
 */
const RETRYABLE_STATUS = new Set([429, 503]);

export async function callGemini(parts, { jsonMode = false, retries = 2 } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body = {
    contents: [{ role: 'user', parts }],
    ...(jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
  };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res;
    try {
      // Gemini has occasionally hung with no response at all (observed
      // directly, outside this app) rather than failing fast — without a
      // timeout that leaves the caller waiting indefinitely instead of
      // falling back to the non-AI wording.
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
    } catch (e) {
      lastError = e.name === 'TimeoutError' ? new Error('Gemini API timed out after 20s') : e;
      if (attempt === retries) throw lastError;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      continue;
    }
    if (res.ok) {
      const data = await res.json();
      const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
      if (!text) throw new Error('Gemini returned no content (possibly blocked by safety filters)');
      return text;
    }
    const text = await res.text().catch(() => '');
    lastError = new Error(`Gemini API error ${res.status}: ${text.slice(0, 300)}`);
    if (!RETRYABLE_STATUS.has(res.status) || attempt === retries) throw lastError;
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw lastError;
}

/** Strips markdown code fences some models add even in JSON mode, then parses. */
export function extractJson(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}
