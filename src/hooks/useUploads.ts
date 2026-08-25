import { useCallback, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import { parseSpreadsheet, parseViaGemini, isSpreadsheet, type ParseResult, type ParsedHolding } from '../lib/uploadParsing';
import { snapshotPortfolio } from '../lib/snapshotPortfolio';

export interface UploadRow {
  id: string;
  filename: string;
  status: 'parsed' | 'needs_review' | 'merged' | 'empty';
  parsed_json: ParseResult;
  created_at: string;
}

interface ExistingHolding {
  id: string; name: string; asset_class: string; invested_omr: number; current_value_omr: number;
}

export interface MergeDiff {
  toInsert: ParsedHolding[];
  toUpdate: { existing: ExistingHolding; incoming: ParsedHolding }[];
  toDelete: ExistingHolding[];
}

const normName = (s: string) => s.trim().toLowerCase();

export function useUploads(userId: string | null) {
  const enabled = supabaseConfigured && !!userId;
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null); // filename currently processing

  const refresh = useCallback(async () => {
    if (!enabled || !userId) return;
    const { data } = await supabase.from('uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setRows((data || []) as UploadRow[]);
  }, [enabled, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (!enabled || !userId) return;
    for (const file of Array.from(files)) {
      setBusy(file.name);
      let result: ParseResult;
      try {
        result = isSpreadsheet(file) ? await parseSpreadsheet(file) : await parseViaGemini(file);
      } catch (e: any) {
        result = { holdings: [], needsReview: [{ field: 'file', why: e?.message || 'Unexpected error while parsing this file.' }] };
      }
      const status: UploadRow['status'] = result.holdings.length
        ? (result.needsReview.length ? 'needs_review' : 'parsed')
        : (result.needsReview.length ? 'needs_review' : 'empty');
      await supabase.from('uploads').insert({ user_id: userId, filename: file.name, status, parsed_json: result });
    }
    setBusy(null);
    await refresh();
  }, [enabled, userId, refresh]);

  /**
   * Computes what a merge would do, without writing anything: holdings whose
   * name matches an existing one (within the same asset class) get updated;
   * new names get added; existing holdings in the file's asset classes that
   * are absent from the file are treated as fully sold and queued for removal.
   * Scoped to only the asset classes present in this file, so e.g. re-uploading
   * just your Indian portfolio never touches US or crypto holdings.
   */
  const previewMerge = useCallback(async (row: UploadRow): Promise<MergeDiff> => {
    const incoming = row.parsed_json.holdings;
    const classes = [...new Set(incoming.map((h) => h.assetClass))];
    const { data } = await supabase
      .from('holdings')
      .select('id,name,asset_class,invested_omr,current_value_omr')
      .eq('user_id', userId)
      .eq('is_demo', false)
      .in('asset_class', classes as string[]);
    const existing = (data || []) as ExistingHolding[];
    const existingByKey = new Map(existing.map((e) => [e.asset_class + '|' + normName(e.name), e]));
    const matchedIds = new Set<string>();

    const toInsert: ParsedHolding[] = [];
    const toUpdate: { existing: ExistingHolding; incoming: ParsedHolding }[] = [];
    for (const h of incoming) {
      const match = existingByKey.get(h.assetClass + '|' + normName(h.name));
      if (match) { toUpdate.push({ existing: match, incoming: h }); matchedIds.add(match.id); }
      else toInsert.push(h);
    }
    const toDelete = existing.filter((e) => !matchedIds.has(e.id));
    return { toInsert, toUpdate, toDelete };
  }, [userId]);

  const commitMerge = useCallback(async (row: UploadRow, diff: MergeDiff) => {
    if (!enabled || !userId) return;
    if (diff.toInsert.length) {
      await supabase.from('holdings').insert(diff.toInsert.map((h) => ({
        user_id: userId, name: h.name, asset_class: h.assetClass, quantity_label: h.quantityLabel, ticker: h.ticker || null,
        invested_omr: h.investedValueOMR ?? h.currentValueOMR, // use real cost basis from the file when present, else fall back to current
        current_value_omr: h.currentValueOMR, price_source: 'manual', recommendation: 'HOLD',
        confidence: h.confidence, note: h.note, is_demo: false,
      })));
    }
    for (const { existing, incoming } of diff.toUpdate) {
      // invested_omr is only overwritten when this file states a real cost basis;
      // otherwise it stays as the proxy captured the first time this holding was
      // seen, so gain/loss can show something other than zero.
      const update: Record<string, any> = {
        current_value_omr: incoming.currentValueOMR, quantity_label: incoming.quantityLabel,
        confidence: incoming.confidence, note: incoming.note, price_source: 'manual', updated_at: new Date().toISOString(),
      };
      if (incoming.investedValueOMR != null) update.invested_omr = incoming.investedValueOMR;
      if (incoming.ticker) update.ticker = incoming.ticker;
      await supabase.from('holdings').update(update).eq('id', existing.id);
    }
    if (diff.toDelete.length) {
      await supabase.from('holdings').delete().in('id', diff.toDelete.map((d) => d.id));
    }

    await snapshotPortfolio(userId);

    await supabase.from('uploads').update({ status: 'merged' }).eq('id', row.id);
    await refresh();
    // Merged holdings need to flow into the financial engine, which currently
    // only reloads holdings on mount — reload so the new data is picked up everywhere.
    window.location.reload();
  }, [enabled, userId, refresh]);

  return { enabled, rows, busy, processFiles, previewMerge, commitMerge };
}
