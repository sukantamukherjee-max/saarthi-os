import { useState } from 'react';
import { sx } from '../components/sx';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/demoMode';

export default function DemoBanner() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // A `?demo` walkthrough never touches this browser's real signed-in
  // account (see usePersonalWealthOS) — so there's no real demo data of
  // theirs to clear, and the control shouldn't imply otherwise.
  const forcedDemo = isDemoMode();

  async function clearDemoData() {
    if (!user) return;
    setBusy(true);
    await supabase.from('holdings').delete().eq('user_id', user.id).eq('is_demo', true);
    // Financial state (holdings, weights, etc.) is loaded once on mount elsewhere —
    // reload so every screen picks up the now-empty portfolio consistently.
    window.location.reload();
  }

  return (
    <div style={sx('display:flex;align-items:center;gap:10px;padding:9px 14px;border:1px dashed var(--color-accent);border-radius:var(--radius-md);margin-bottom:22px;font-size:12px;background:var(--color-accent-100);flex-wrap:wrap')}>
      <span style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-800);font-weight:600')}>Demo data</span>
      <span style={sx('color:var(--color-accent-900);opacity:.85')}>Holdings below are illustrative placeholders. {forcedDemo ? 'This is a shareable walkthrough — nothing you do here touches any real account.' : 'Upload your real portfolio to replace them — nothing here is a market quote.'}</span>
      {user && !forcedDemo && (
        confirming ? (
          <span style={sx('display:flex;align-items:center;gap:8px;margin-left:auto')}>
            <span style={sx('font-size:11.5px;color:var(--color-accent-900)')}>Remove all demo holdings — you can't undo this.</span>
            <button className="btn btn-primary" style={sx('font-size:11.5px;padding:4px 10px;min-height:0')} disabled={busy} onClick={clearDemoData}>
              {busy ? 'Removing…' : 'Confirm'}
            </button>
            <button className="btn btn-ghost" style={sx('font-size:11.5px;padding:4px 10px;min-height:0')} onClick={() => setConfirming(false)}>Cancel</button>
          </span>
        ) : (
          <button className="btn btn-secondary" style={sx('font-size:11.5px;padding:4px 10px;min-height:0;margin-left:auto')} onClick={() => setConfirming(true)}>
            Clear demo data
          </button>
        )
      )}
    </div>
  );
}
