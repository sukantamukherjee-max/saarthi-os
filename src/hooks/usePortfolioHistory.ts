import { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';

export interface SnapshotPoint {
  date: string; // formatted for display
  recorded_at: string;
  invested: number;
  current: number;
}

/** One time series per asset class, from the portfolio_snapshots table. */
export function usePortfolioHistory(userId: string | null) {
  const enabled = supabaseConfigured && !!userId;
  const [byClass, setByClass] = useState<Record<string, SnapshotPoint[]>>({});
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !userId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('portfolio_snapshots')
      .select('asset_class,invested_omr,current_value_omr,recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        const grouped: Record<string, SnapshotPoint[]> = {};
        for (const row of data || []) {
          const list = grouped[row.asset_class] || (grouped[row.asset_class] = []);
          list.push({
            date: new Date(row.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            recorded_at: row.recorded_at,
            invested: Number(row.invested_omr) || 0,
            current: Number(row.current_value_omr) || 0,
          });
        }
        setByClass(grouped);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [enabled, userId]);

  return { enabled, loading, byClass };
}
