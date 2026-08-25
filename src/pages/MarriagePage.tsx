import { sx } from '../components/sx';

export default function MarriagePage({ vm }: { vm: any }) {
  const mr = vm.mr;
  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Marriage</h1>
      <p style={sx('font-size:13px;font-style:italic;color:color-mix(in srgb,var(--color-text) 58%,transparent);margin:0 0 24px;padding-bottom:14px;border-bottom:1px solid var(--color-divider)')}>Lowest-priority goal in the hierarchy · costs are 2026 market estimates, not quotations</p>

      <div className="card" style={sx('padding:22px 24px;margin-bottom:22px;gap:18px')}>
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;align-items:start')}>
          <div>
            <div style={sx('font-size:11px;opacity:.55')}>Daughter's age at marriage</div>
            <div style={sx('font-family:var(--font-heading);font-size:30px;font-variant-numeric:tabular-nums')}>{mr.age}</div>
            <input type="range" min={25} max={30} step={1} value={mr.age} onChange={vm.h.marriageAge} aria-label="Marriage age" />
            <div style={sx('font-size:11px;opacity:.5')}>In {mr.years} years, when you are {mr.parentAge}</div>
          </div>
          <div>
            <div style={sx('font-size:11px;opacity:.55;margin-bottom:6px')}>Budget tier</div>
            <div className="seg" style={sx('flex-wrap:wrap')}>
              <label className="seg-opt"><input type="radio" name="mtier" value="Basic" checked={mr.tBasic} onChange={vm.h.marTier} />Basic</label>
              <label className="seg-opt"><input type="radio" name="mtier" value="Moderate" checked={mr.tModerate} onChange={vm.h.marTier} />Moderate</label>
              <label className="seg-opt"><input type="radio" name="mtier" value="High" checked={mr.tHigh} onChange={vm.h.marTier} />High</label>
              <label className="seg-opt"><input type="radio" name="mtier" value="Premium" checked={mr.tPremium} onChange={vm.h.marTier} />Premium</label>
            </div>
            <div style={sx('font-size:11px;opacity:.55;margin:14px 0 6px')}>Location</div>
            <div className="seg" style={sx('flex-wrap:wrap')}>
              <label className="seg-opt"><input type="radio" name="mloc" value="West Bengal / Tier-2" checked={mr.lWB} onChange={vm.h.marLoc} />West Bengal / Tier-2</label>
              <label className="seg-opt"><input type="radio" name="mloc" value="Major Tier-1 city" checked={mr.lT1} onChange={vm.h.marLoc} />Tier-1 city</label>
              <label className="seg-opt"><input type="radio" name="mloc" value="Indian destination" checked={mr.lDest} onChange={vm.h.marLoc} />Destination</label>
            </div>
          </div>
        </div>
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px')}>
        <div className="card" style={sx('padding:20px 22px;gap:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Cost</h4>
          {mr.rows.map((r: any, i: number) => (
            <div key={i} style={sx('display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--color-divider)')}>
              <div><div style={sx('font-size:13.5px')}>{r.label}</div><div style={sx('font-size:10.5px;opacity:.5')}>{r.note}</div></div>
              <div style={sx('text-align:right')}><div style={sx('font-size:14.5px;font-variant-numeric:tabular-nums;' + (r.css || ''))}>{r.value}</div><div style={sx('font-size:11px;opacity:.5;font-variant-numeric:tabular-nums')}>{r.sub}</div></div>
            </div>
          ))}
        </div>
        <div className="card" style={sx('padding:20px 22px;gap:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Assumptions &amp; sources</h4>
          {mr.sources.map((s: any, i: number) => (
            <div key={i} style={sx('padding:9px 0;border-bottom:1px solid var(--color-divider)')}>
              <div style={sx('display:flex;justify-content:space-between;gap:10px')}><span style={sx('font-size:13px')}>{s.label}</span><span style={sx('font-size:13px;font-variant-numeric:tabular-nums')}>{s.value}</span></div>
              <div style={sx('font-size:10.5px;opacity:.5')}>{s.src}</div>
            </div>
          ))}
          <p style={sx('font-size:11.5px;opacity:.6;margin:6px 0 0')}>These are planning estimates drawn from published 2026 Indian wedding-cost ranges. They are not quotations and will vary widely by family, season and city. Treat every figure here as an ASSUMPTION you can override.</p>
        </div>
      </div>
    </div>
  );
}
