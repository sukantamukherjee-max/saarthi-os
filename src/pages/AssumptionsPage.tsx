import { useState } from 'react';
import { sx } from '../components/sx';

export default function AssumptionsPage({ vm }: { vm: any }) {
  const asData = vm.as;
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [fxError, setFxError] = useState<string | null>(null);

  async function refreshLive(it: any) {
    setBusyKey(it.key);
    setFxError(null);
    try {
      const res = await fetch('/.netlify/functions/fx-rates');
      if (!res.ok) throw new Error('FX service unavailable');
      const data = await res.json();
      if (it.live === 'OMR_INR') {
        if (!data.OMR_INR) throw new Error('No OMR/INR rate returned');
        vm.h.setAssumption(it.key, Math.round(data.OMR_INR * 100) / 100);
      } else if (it.live === 'OMR_USD') {
        // fx-rates returns USD per 1 OMR; this field is stored as OMR per 1 USD (matches how the model uses it).
        if (!data.OMR_USD) throw new Error('No OMR/USD rate returned');
        vm.h.setAssumption(it.key, Math.round((1 / data.OMR_USD) * 10000) / 10000);
      }
    } catch (e: any) {
      setFxError(e?.message || 'Could not fetch the live rate.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <div style={sx('display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:24px')}>
        <div>
          <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Assumptions</h1>
          <p style={sx('font-size:13px;color:color-mix(in srgb,var(--color-text) 55%,transparent);margin:0')}>Every model input, its source and its date. Edit anything; the whole plan recomputes.</p>
        </div>
        <button className="btn btn-secondary" onClick={vm.h.resetAll}>Reset all to defaults</button>
      </div>
      {fxError && <div style={sx('font-size:12.5px;color:var(--pw-neg);margin-bottom:14px')}>{fxError}</div>}
      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px')}>
        {asData.groups.map((g: any, gi: number) => (
          <div key={gi} className="card" style={sx('padding:18px 20px;gap:6px')}>
            <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent);margin-bottom:4px')}>{g.name}</div>
            {g.items.map((it: any, ii: number) => (
              <div key={ii} style={{ display: 'grid', gridTemplateColumns: it.live ? '1fr 96px 28px' : '1fr 96px', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-divider)' }}>
                <div>
                  <div style={sx('font-size:13px')}>{it.label}</div>
                  <div style={sx('font-size:10.5px;opacity:.48')}>{it.source}</div>
                </div>
                <div style={sx('display:flex;align-items:center;gap:5px')}>
                  <input className="input" type="number" step={it.step} value={it.value} onChange={it.onChange} style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '4px 6px', minHeight: 28, fontSize: '12.5px' }} />
                  <span style={sx('font-size:10.5px;opacity:.5;width:22px')}>{it.unit}</span>
                </div>
                {it.live && (
                  <button
                    type="button"
                    title="Refresh from live rate"
                    onClick={() => refreshLive(it)}
                    disabled={busyKey === it.key}
                    style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: '1px solid var(--color-divider)', borderRadius: 999, background: 'transparent', cursor: 'pointer', color: 'var(--color-accent)', padding: 0 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={busyKey === it.key ? { animation: 'spin 0.8s linear infinite' } : undefined}>
                      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"></path><path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"></path><path d="M3 21v-5h5"></path>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="card" style={sx('padding:18px 20px;margin-top:18px;gap:8px;border-style:dashed')}>
        <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)')}>Provenance key</div>
        <div style={sx('display:flex;gap:22px;flex-wrap:wrap;font-size:12.5px')}>
          <span><strong>Fact</strong> — from your portfolio file or stated directly by you.</span>
          <span><strong>Assumption</strong> — a model input you can change.</span>
          <span><strong>Estimate</strong> — research-based, dated, and uncertain.</span>
          <span><strong>Scenario</strong> — a hypothetical, never a forecast.</span>
        </div>
      </div>
    </div>
  );
}
