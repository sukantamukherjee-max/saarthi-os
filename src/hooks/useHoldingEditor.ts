import { supabase } from '../lib/supabaseClient';
import { snapshotPortfolio } from '../lib/snapshotPortfolio';
import { useAuth } from './useAuth';

export interface HoldingEdit {
  name: string;
  currentValueOMR: number;
  investedOMR: number;
  quantityLabel: string;
  ticker: string;
}

/** Direct per-holding edit/delete — for correcting or removing a single line item without a full upload/reconcile pass. */
export function useHoldingEditor() {
  const { user } = useAuth();

  async function updateHolding(id: string, edit: HoldingEdit) {
    await supabase.from('holdings').update({
      name: edit.name,
      current_value_omr: edit.currentValueOMR,
      invested_omr: edit.investedOMR,
      quantity_label: edit.quantityLabel,
      ticker: edit.ticker || null,
      note: 'Edited manually.',
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (user) await snapshotPortfolio(user.id);
    // Holdings are loaded once on mount elsewhere — reload so every screen picks up the change.
    window.location.reload();
  }

  async function deleteHolding(id: string) {
    await supabase.from('holdings').delete().eq('id', id);
    if (user) await snapshotPortfolio(user.id);
    window.location.reload();
  }

  return { updateHolding, deleteHolding };
}
