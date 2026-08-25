import { useEffect, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import { Model } from '../financial/model';
import { DEMO_HOLDINGS } from '../financial/demoPortfolio';
import type { Assumptions, Holding } from '../financial/types';

function rowToHolding(row: any): Holding {
  return {
    n: row.name,
    c: row.asset_class,
    q: row.quantity_label || '—',
    inv: Number(row.invested_omr) || 0,
    cur: Number(row.current_value_omr) || 0,
    rec: row.recommendation || 'HOLD',
    cf: row.confidence || 'Medium',
    why: row.note || '',
    fresh: row.price_source === 'live' ? 'Live' : 'Manual',
    isDemo: !!row.is_demo,
  };
}

function holdingToRow(h: Holding, userId: string) {
  return {
    user_id: userId,
    name: h.n,
    asset_class: h.c,
    quantity_label: h.q,
    invested_omr: h.inv,
    current_value_omr: h.cur,
    price_source: 'manual',
    recommendation: h.rec,
    confidence: h.cf,
    note: h.why,
    is_demo: !!h.isDemo,
  };
}

/**
 * Loads/saves this user's assumptions + holdings from Supabase. On a brand
 * new account, seeds one default assumptions row and the demo holdings so
 * the app has something to show immediately (clearly marked is_demo).
 * Falls back to `enabled: false` when Supabase isn't configured or no user
 * is signed in, so callers can use local-only state instead.
 */
export function useCloudPlan(userId: string | null, model: Model) {
  const enabled = supabaseConfigured && !!userId;
  const [loading, setLoading] = useState(enabled);
  const [assumptions, setAssumptions] = useState<Assumptions | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !userId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: aRow } = await supabase.from('assumptions').select('data').eq('user_id', userId).maybeSingle();
      let a = aRow?.data as Assumptions | undefined;
      const isFirstEverLogin = !a;
      if (!a) {
        a = model.defaults();
        await supabase.from('assumptions').insert({ user_id: userId, data: a });
      }

      let hs: Holding[] = [];
      if (isFirstEverLogin) {
        // Seed demo holdings only on true first-time setup — not just whenever the
        // table happens to be empty, since the user can deliberately clear demo
        // data (or delete all holdings) and that must stay empty on reload.
        const seed = DEMO_HOLDINGS.map(h => holdingToRow(h, userId));
        const { data: inserted } = await supabase.from('holdings').insert(seed).select('*');
        hs = (inserted || []).map(rowToHolding);
      } else {
        const { data: hRows } = await supabase.from('holdings').select('*').eq('user_id', userId);
        hs = (hRows || []).map(rowToHolding);
      }

      if (!cancelled) {
        setAssumptions(a!);
        setHoldings(hs);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, userId, model]);

  function saveAssumptions(next: Assumptions) {
    setAssumptions(next);
    if (!enabled || !userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase.from('assumptions').upsert({ user_id: userId, data: next, updated_at: new Date().toISOString() }).then();
    }, 500);
  }

  return { enabled, loading, assumptions, holdings, saveAssumptions };
}
