import { sx } from '../components/sx';

export default function AssumptionsPage({ vm }: { vm: any }) {
  const asData = vm.as;
  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <div style={sx('display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:24px')}>
        <div>
          <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Assumptions</h1>
          <p style={sx('font-size:13px;color:color-mix(in srgb,var(--color-text) 55%,transparent);margin:0')}>Every model input, its source and its date. Edit anything; the whole plan recomputes.</p>
        </div>
        <button className="btn btn-secondary" onClick={vm.h.resetAll}>Reset all to defaults</button>
      </div>
      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px')}>
        {asData.groups.map((g: any, gi: number) => (
          <div key={gi} className="card" style={sx('padding:18px 20px;gap:6px')}>
            <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent);margin-bottom:4px')}>{g.name}</div>
            {g.items.map((it: any, ii: number) => (
              <div key={ii} style={sx('display:grid;grid-template-columns:1fr 96px;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--color-divider)')}>
                <div>
                  <div style={sx('font-size:13px')}>{it.label}</div>
                  <div style={sx('font-size:10.5px;opacity:.48')}>{it.source}</div>
                </div>
                <div style={sx('display:flex;align-items:center;gap:5px')}>
                  <input className="input" type="number" step={it.step} value={it.value} onChange={it.onChange} style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '4px 6px', minHeight: 28, fontSize: '12.5px' }} />
                  <span style={sx('font-size:10.5px;opacity:.5;width:22px')}>{it.unit}</span>
                </div>
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
