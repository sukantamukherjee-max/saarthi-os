import * as XLSX from 'xlsx';
import type { AssetClass } from '../financial/types';

export interface ParsedHolding {
  name: string;
  assetClass: AssetClass | null;
  quantityLabel: string;
  currentValueOMR: number | null;
  currency: string;
  confidence: 'High' | 'Medium' | 'Low';
  note: string;
}

export interface ParseResult {
  holdings: ParsedHolding[];
  needsReview: { field: string; why: string }[];
}

const NAME_KEYS = ['name', 'holding', 'holdingname', 'asset', 'assetname', 'security', 'scheme', 'schemename', 'fund', 'fundname', 'symbol', 'ticker', 'stock'];
const VALUE_KEYS = ['currentvalue', 'marketvalue', 'value', 'amount', 'currentval', 'balance', 'valuation'];
const QTY_KEYS = ['quantity', 'qty', 'units', 'shares', 'nooFunits'];
const CCY_KEYS = ['currency', 'ccy'];
const CLASS_KEYS = ['assetclass', 'class', 'category', 'type', 'segment'];

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findKey(headers: string[], candidates: string[]) {
  const normHeaders = headers.map(norm);
  for (const c of candidates) {
    const i = normHeaders.indexOf(c);
    if (i >= 0) return headers[i];
  }
  return null;
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
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });

  if (!rows.length) {
    return { holdings: [], needsReview: [{ field: 'file', why: `"${file.name}" has no readable rows.` }] };
  }

  const headers = Object.keys(rows[0]);
  const nameKey = findKey(headers, NAME_KEYS);
  const valueKey = findKey(headers, VALUE_KEYS);
  const qtyKey = findKey(headers, QTY_KEYS);
  const ccyKey = findKey(headers, CCY_KEYS);
  const classKey = findKey(headers, CLASS_KEYS);

  if (!nameKey || !valueKey) {
    return {
      holdings: [],
      needsReview: [{ field: 'columns', why: `Could not find a name and a value column in "${file.name}" (saw: ${headers.join(', ')}). Rename columns to something like "Name" and "Current Value" and re-upload.` }],
    };
  }

  const holdings: ParsedHolding[] = [];
  const needsReview: { field: string; why: string }[] = [];
  const fx = await loadFx();

  for (const row of rows) {
    const name = row[nameKey];
    const rawValue = row[valueKey];
    if (!name || rawValue == null || rawValue === '') continue;
    const value = Number(String(rawValue).replace(/[,\s]/g, ''));
    if (!Number.isFinite(value)) {
      needsReview.push({ field: name, why: `Value "${rawValue}" is not a number.` });
      continue;
    }
    const currency = (ccyKey ? row[ccyKey] : null) || 'OMR';
    const currentValueOMR = toOMR(value, currency, fx);
    const assetClass = (classKey ? guessAssetClass(String(row[classKey])) : null) || guessAssetClass(String(name));
    const quantityLabel = qtyKey && row[qtyKey] != null ? String(row[qtyKey]) : '—';

    if (currentValueOMR == null) {
      needsReview.push({ field: name, why: `Currency "${currency}" could not be converted to OMR (no live rate available).` });
      continue;
    }
    if (!assetClass) {
      needsReview.push({ field: name, why: 'Could not determine an asset class from the row — add a "Category" column with a value like "Indian Equity" or "Crypto" and re-upload.' });
      continue;
    }
    holdings.push({
      name: String(name),
      assetClass,
      quantityLabel,
      currentValueOMR,
      currency: String(currency).toUpperCase(),
      confidence: classKey ? 'High' : 'Medium',
      note: 'Cost basis not provided — profit/loss for this holding is not tracked.',
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
      currency: h.currency || 'OMR',
      confidence: h.confidence || 'Medium',
      note: h.note || '',
    }));
  return { holdings, needsReview: data.needsReview || [] };
}

export function isSpreadsheet(file: File) {
  return /\.(xlsx|xls|csv)$/i.test(file.name);
}
