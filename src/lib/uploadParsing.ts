import * as XLSX from 'xlsx';
import type { AssetClass } from '../financial/types';

export interface ParsedHolding {
  name: string;
  assetClass: AssetClass | null;
  quantityLabel: string;
  currentValueOMR: number | null;
  investedValueOMR?: number | null;
  currency: string;
  confidence: 'High' | 'Medium' | 'Low';
  note: string;
  /** Ticker/symbol captured from a dedicated Ticker/Symbol column, when the file has both a Name and a Ticker column. */
  ticker?: string | null;
}

export interface ParseResult {
  holdings: ParsedHolding[];
  needsReview: { field: string; why: string }[];
}

// Matched by "does the normalized header contain this substring", tried in
// priority order, so real-world variants (parenthetical currency suffixes,
// "Stock Name", "Closing value", etc.) are caught without exact equality.
const NAME_KEYS = ['name', 'holding', 'security', 'scheme', 'fund', 'symbol', 'ticker', 'stock', 'instrument'];
const INVESTED_KEYS = ['invested', 'buyvalue', 'buycost', 'costbasis', 'purchasevalue', 'totalcost', 'amountinvested'];
const CURRENT_VALUE_KEYS = ['currentvalue', 'marketvalue', 'closingvalue', 'presentvalue', 'totalvalue', 'currentval'];
const GENERIC_VALUE_KEYS = ['value', 'amount', 'balance', 'valuation'];
const AVG_COST_KEYS = ['averagecost', 'avgcost', 'averagebuyprice', 'avgbuyprice', 'buyprice'];
const QTY_KEYS = ['totalshares', 'quantity', 'qty', 'units', 'shares', 'noofunits'];
const TICKER_KEYS = ['ticker', 'symbol'];
const CCY_KEYS = ['currency', 'ccy'];
const CLASS_KEYS = ['assetclass', 'category', 'segment', 'class', 'type'];

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Finds the first header whose normalized form contains one of `candidates` (tried in priority order), skipping any header already claimed by another field. */
function findKey(headers: string[], candidates: string[], claimed?: Set<string>) {
  for (const c of candidates) {
    for (const h of headers) {
      if (claimed?.has(h)) continue;
      if (norm(h).includes(c)) return h;
    }
  }
  return null;
}

const HEADER_HINT_KEYS = [
  'name', 'holding', 'security', 'scheme', 'fund', 'symbol', 'ticker', 'stock', 'instrument', 'isin',
  'invested', 'value', 'amount', 'balance', 'valuation', 'cost', 'price',
  'quantity', 'qty', 'units', 'shares', 'currency', 'ccy', 'class', 'category',
];

/**
 * Broker exports (Zerodha console, Vested statements, etc.) often prepend a
 * few metadata rows ("Name: ...", "Client ID: ...") before the real column
 * headers. Reading row 0 blindly in that case yields junk headers like
 * "__EMPTY_1". This scans the first ~20 rows and picks the one that most
 * looks like a header row (several cells matching known column vocabulary),
 * falling back to row 0 when nothing scores better.
 */
function findHeaderRow(aoa: any[][]): number {
  let bestIdx = 0;
  let bestScore = -1;
  const scanLimit = Math.min(aoa.length, 20);
  for (let i = 0; i < scanLimit; i++) {
    const row = aoa[i] || [];
    const nonEmpty = row.filter((c) => c != null && String(c).trim() !== '');
    if (nonEmpty.length < 2) continue;
    let score = 0;
    for (const cell of nonEmpty) {
      const n = norm(String(cell));
      if (HEADER_HINT_KEYS.some((k) => n.includes(k))) score++;
    }
    // Prefer rows where most non-empty cells look like column labels, not a
    // couple of label:value metadata pairs sitting in an otherwise sparse row.
    const density = score / nonEmpty.length;
    const weighted = score + density;
    if (score >= 2 && weighted > bestScore) { bestScore = weighted; bestIdx = i; }
  }
  return bestIdx;
}

/** Pulls a 3-letter currency code out of a header like "Current Value (USD)". */
function currencyFromHeader(header: string | null): string | null {
  if (!header) return null;
  const m = /\(([a-zA-Z]{3})\)/.exec(header);
  return m ? m[1].toUpperCase() : null;
}

function inferCurrencyFromClass(assetClass: AssetClass | null): string {
  if (assetClass === 'Indian Equity' || assetClass === 'Gold') return 'INR';
  if (assetClass === 'US Equity' || assetClass === 'Crypto') return 'USD';
  return 'OMR';
}

function parseNum(raw: any): number {
  return Number(String(raw ?? '').replace(/[,\s]/g, ''));
}

const KNOWN_CLASSES: AssetClass[] = ['Indian Equity', 'US Equity', 'Crypto', 'Liquid Fund', 'Cash', 'Gold'];

function guessAssetClass(text: string): AssetClass | null {
  const raw = text.trim();
  const exact = KNOWN_CLASSES.find((k) => k.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const t = raw.toLowerCase();
  if (/bitcoin|ethereum|crypto|\bbtc\b|\beth\b|\bsol\b|coin/.test(t)) return 'Crypto';
  if (/\bgold\b/.test(t)) return 'Gold';
  if (/liquid fund|money market|overnight fund/.test(t)) return 'Liquid Fund';
  if (/\bcash\b|savings account|current account/.test(t)) return 'Cash';
  if (/nifty|sensex|\bbse\b|\bnse\b|indian?|mutual fund|elss|\binr\b/.test(t)) return 'Indian Equity';
  if (/s&p|nasdaq|\bnyse\b|us equity|\busd\b|\betf\b|\bstock\b/.test(t)) return 'US Equity';
  return null;
}

let fxCache: { OMR_INR?: number; OMR_USD?: number } | null = null;

/** Fetches OMR FX rates once per file (not once per row) and caches them for reuse. */
async function loadFx(): Promise<{ OMR_INR?: number; OMR_USD?: number }> {
  if (fxCache) return fxCache;
  try {
    const res = await fetch('/.netlify/functions/fx-rates');
    fxCache = res.ok ? await res.json() : {};
  } catch {
    fxCache = {};
  }
  return fxCache;
}

/** Converts a value in a given currency to OMR using the cached FX rates. Returns null if the currency isn't one we can convert. */
function toOMR(value: number, currency: string, fx: { OMR_INR?: number; OMR_USD?: number }): number | null {
  const ccy = (currency || 'OMR').toUpperCase();
  if (ccy === 'OMR') return value;
  if (ccy === 'INR' && fx.OMR_INR) return value / fx.OMR_INR;
  if (ccy === 'USD' && fx.OMR_USD) return value / fx.OMR_USD;
  return null;
}

export async function parseSpreadsheet(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null, blankrows: false });

  if (!aoa.length) {
    return { holdings: [], needsReview: [{ field: 'file', why: `"${file.name}" has no readable rows.` }] };
  }

  // Skip past any metadata rows (e.g. "Name: ...", "Client ID: ...") that some
  // broker exports place above the real column headers.
  const headerRowIdx = findHeaderRow(aoa);
  const headerRow = aoa[headerRowIdx].map((h) => (h == null ? '' : String(h).trim()));
  const rows: Record<string, any>[] = aoa.slice(headerRowIdx + 1)
    .filter((r) => r.some((c) => c != null && String(c).trim() !== ''))
    .map((r) => {
      const obj: Record<string, any> = {};
      headerRow.forEach((h, i) => { if (h) obj[h] = r[i] ?? null; });
      return obj;
    });

  if (!rows.length) {
    return { holdings: [], needsReview: [{ field: 'file', why: `"${file.name}" has no readable data rows below its header row.` }] };
  }

  const headers = headerRow.filter(Boolean);
  const claimed = new Set<string>();
  const nameKey = findKey(headers, NAME_KEYS, claimed);
  if (nameKey) claimed.add(nameKey);
  const investedKey = findKey(headers, INVESTED_KEYS, claimed);
  if (investedKey) claimed.add(investedKey);
  let valueKey = findKey(headers, CURRENT_VALUE_KEYS, claimed);
  if (!valueKey) valueKey = findKey(headers, GENERIC_VALUE_KEYS, claimed);
  if (valueKey) claimed.add(valueKey);
  const avgCostKey = investedKey ? null : findKey(headers, AVG_COST_KEYS, claimed);
  const qtyKey = findKey(headers, QTY_KEYS, claimed);
  const ccyKey = findKey(headers, CCY_KEYS, claimed);
  const classKey = findKey(headers, CLASS_KEYS, claimed);
  const isinKey = findKey(headers, ['isin'], claimed);
  const tickerKey = findKey(headers, TICKER_KEYS, claimed);
  // A file of individual stock/ETF positions (has a ticker or ISIN column, no
  // category column) is unambiguous within this app's fixed asset-class list —
  // its currency alone tells us Indian Equity vs US Equity, so this is applying
  // the taxonomy's definition, not guessing.
  const looksLikeEquityFile = !classKey && (!!isinKey || headers.some((h) => norm(h).includes('ticker') || norm(h).includes('symbol')));

  if (!nameKey || !valueKey) {
    return {
      holdings: [],
      needsReview: [{ field: 'columns', why: `Could not find a name and a value column in "${file.name}" (saw: ${headers.join(', ')}). Rename columns to something like "Name" and "Current Value" and re-upload.` }],
    };
  }

  const holdings: ParsedHolding[] = [];
  const needsReview: { field: string; why: string }[] = [];
  const fx = await loadFx();
  const headerCurrency = currencyFromHeader(valueKey);

  for (const row of rows) {
    const name = row[nameKey];
    const rawValue = row[valueKey];
    if (!name || rawValue == null || rawValue === '') continue;
    const value = parseNum(rawValue);
    if (!Number.isFinite(value)) {
      needsReview.push({ field: name, why: `Value "${rawValue}" is not a number.` });
      continue;
    }
    let assetClass = (classKey ? guessAssetClass(String(row[classKey])) : null) || guessAssetClass(String(name));
    let assetClassNote = '';

    // Explicit currency signal only (column value or a "(USD)"-style header suffix) —
    // doesn't depend on assetClass, so it's safe to use for the ISIN/ticker fallback below.
    const explicitCurrency = (ccyKey ? row[ccyKey] : null) || headerCurrency;

    if (!assetClass && looksLikeEquityFile) {
      const isinPrefix = isinKey && row[isinKey] ? /^([A-Za-z]{2})/.exec(String(row[isinKey]).trim())?.[1]?.toUpperCase() : null;
      if (isinPrefix === 'IN') { assetClass = 'Indian Equity'; assetClassNote = 'Asset class inferred from ISIN country code — verify and recategorize if wrong.'; }
      else if (isinPrefix === 'US') { assetClass = 'US Equity'; assetClassNote = 'Asset class inferred from ISIN country code — verify and recategorize if wrong.'; }
      else if (explicitCurrency?.toUpperCase() === 'USD') { assetClass = 'US Equity'; assetClassNote = 'Asset class inferred from USD currency — verify and recategorize if wrong.'; }
      else if (explicitCurrency?.toUpperCase() === 'INR') { assetClass = 'Indian Equity'; assetClassNote = 'Asset class inferred from INR currency — verify and recategorize if wrong.'; }
    }

    let currencyInferred = false;
    let currency = explicitCurrency;
    if (!currency) {
      currency = inferCurrencyFromClass(assetClass);
      currencyInferred = true;
    }
    const currentValueOMR = toOMR(value, currency, fx);
    const quantityLabel = qtyKey && row[qtyKey] != null ? String(row[qtyKey]) : '—';

    // Prefer a real cost-basis figure from the file over the current value.
    let investedRaw: number | null = investedKey && row[investedKey] != null ? parseNum(row[investedKey]) : null;
    if ((investedRaw == null || !Number.isFinite(investedRaw)) && avgCostKey && qtyKey && row[qtyKey] != null) {
      const avgCost = parseNum(row[avgCostKey]);
      const qtyNum = parseNum(row[qtyKey]);
      if (Number.isFinite(avgCost) && Number.isFinite(qtyNum)) investedRaw = avgCost * qtyNum;
    }
    const hasInvested = investedRaw != null && Number.isFinite(investedRaw);
    const investedValueOMR = hasInvested ? toOMR(investedRaw as number, currency, fx) : null;

    if (currentValueOMR == null) {
      needsReview.push({ field: name, why: `Currency "${currency}" could not be converted to OMR (no live rate available).` });
      continue;
    }
    if (!assetClass) {
      needsReview.push({ field: name, why: 'Could not determine an asset class from the row — add a "Category" column with a value like "Indian Equity" or "Crypto" and re-upload.' });
      continue;
    }
    const costNote = hasInvested ? 'Cost basis read from file.' : 'Cost basis not provided — profit/loss for this holding is not tracked.';
    holdings.push({
      name: String(name),
      assetClass,
      quantityLabel,
      currentValueOMR,
      investedValueOMR,
      currency: String(currency).toUpperCase(),
      confidence: assetClassNote || currencyInferred ? 'Medium' : (classKey ? 'High' : 'Medium'),
      note: assetClassNote ? `${assetClassNote} ${costNote}` : costNote,
      ticker: tickerKey && row[tickerKey] != null ? String(row[tickerKey]).trim() : null,
    });
  }

  return { holdings, needsReview };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function parseViaGemini(file: File): Promise<ParseResult> {
  const fileBase64 = await fileToBase64(file);
  const res = await fetch('/.netlify/functions/parse-statement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64, mimeType: file.type || 'application/octet-stream', filename: file.name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { holdings: [], needsReview: [{ field: 'file', why: body.error || `Could not parse "${file.name}".` }] };
  }
  const data = await res.json();
  const holdings: ParsedHolding[] = (data.holdings || [])
    .filter((h: any) => h.currentValueOMR != null && h.assetClass && h.assetClass !== 'Other')
    .map((h: any) => ({
      name: h.name,
      assetClass: h.assetClass,
      quantityLabel: h.quantityLabel || '—',
      currentValueOMR: h.currentValueOMR,
      investedValueOMR: h.investedValueOMR ?? null,
      currency: h.currency || 'OMR',
      confidence: h.confidence || 'Medium',
      note: h.note || '',
      ticker: h.ticker || null,
    }));
  return { holdings, needsReview: data.needsReview || [] };
}

export function isSpreadsheet(file: File) {
  return /\.(xlsx|xls|csv)$/i.test(file.name);
}
