import { supabase } from './supabaseClient';

/**
 * Records one portfolio_snapshots row per asset class with the current
 * totals — the data source for the "Value over time" history chart. Call
 * this after ANY holdings change (upload merge, manual edit/delete, live
 * price refresh), not just uploads, so the chart reflects every way a
 * holding can change.
 */
export async function snapshotPortfolio(userId: string) {
  const { data: all } = await supabase.from('holdings').select('asset_class,invested_omr,current_value_omr').eq('user_id', userId).eq('is_demo', false);
  const totals = new Map<string, { invested: number; current: number }>();
  for (const h of all || []) {
    const t = totals.get(h.asset_class) || { invested: 0, current: 0 };
    t.invested += Number(h.invested_omr) || 0;
    t.current += Number(h.current_value_omr) || 0;
    totals.set(h.asset_class, t);
  }
  const rows = [...totals.entries()].map(([asset_class, t]) => ({
    user_id: userId, asset_class, invested_omr: t.invested, current_value_omr: t.current,
  }));
  if (rows.length) await supabase.from('portfolio_snapshots').insert(rows);
}
