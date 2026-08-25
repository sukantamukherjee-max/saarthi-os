import { useCallback, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import { parseSpreadsheet, parseViaGemini, isSpreadsheet, type ParseResult } from '../lib/uploadParsing';

export interface UploadRow {
  id: string;
  filename: string;
  status: 'parsed' | 'needs_review' | 'merged' | 'empty';
  parsed_json: ParseResult;
  created_at: string;
}

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

  const mergeUpload = useCallback(async (row: UploadRow) => {
    if (!enabled || !userId) return;
    const rowsToInsert = row.parsed_json.holdings.map((h) => ({
      user_id: userId,
      name: h.name,
      asset_class: h.assetClass,
      quantity_label: h.quantityLabel,
      invested_omr: h.currentValueOMR, // no cost basis from uploads; see note
      current_value_omr: h.currentValueOMR,
      price_source: 'manual',
      recommendation: 'HOLD',
      confidence: h.confidence,
      note: h.note,
      is_demo: false,
    }));
    if (rowsToInsert.length) await supabase.from('holdings').insert(rowsToInsert);
    await supabase.from('uploads').update({ status: 'merged' }).eq('id', row.id);
    await refresh();
    // Merged holdings need to flow into the financial engine, which currently
    // only reloads holdings on mount — reload so the new data is picked up everywhere.
    window.location.reload();
  }, [enabled, userId, refresh]);

  return { enabled, rows, busy, processFiles, mergeUpload };
}
