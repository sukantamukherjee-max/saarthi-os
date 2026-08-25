import { sx } from '../components/sx';

export default function RetirementPage({ vm }: { vm: any }) {
  const rt = vm.rt;
  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Retirement</h1>
      <p style={sx('font-size:13px;font-style:italic;color:color-mix(in srgb,var(--color-text) 58%,transparent);margin:0 0 24px;padding-bottom:14px;border-bottom:1px solid var(--color-divider)')}>Planning from age {rt.currentAge} to {rt.planAge} · {rt.simNote} · results are probabilities, not guarantees</p>

      <div className="card" style={sx('padding:24px 26px;margin-bottom:24px;gap:18px')}>
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:18px')}>
          <div><div style={sx('font-size:11px;opacity:.55')}>Retirement age</div><div style={sx('font-family:var(--font-heading);font-size:36px;font-variant-numeric:tabular-nums;line-height:1.05')}>{rt.retAge}</div></div>
          <div><div style={sx('font-size:11px;opacity:.55')}>Success probability</div><div style={sx('font-family:var(--font-heading);font-size:36px;font-variant-numeric:tabular-nums;line-height:1.05')}>{rt.prob}</div></div>
          <div><div style={sx('font-size:11px;opacity:.55')}>Required corpus</div><div style={sx('font-size:19px;font-variant-numeric:tabular-nums;margin-top:8px')}>{rt.req}</div><div style={sx('font-size:11px;opacity:.5')}>{rt.reqINR}</div></div>
          <div><div style={sx('font-size:11px;opacity:.55')}>Projected corpus (median)</div><div style={sx('font-size:19px;font-variant-numeric:tabular-nums;margin-top:8px')}>{rt.proj}</div><div style={sx('font-size:11px;opacity:.5')}>{rt.projINR}</div></div>
          <div><div style={sx('font-size:11px;opacity:.55')}>Required annual investment</div><div style={sx('font-size:19px;font-variant-numeric:tabular-nums;margin-top:8px')}>{rt.reqSave}</div><div style={sx('font-size:11px;opacity:.5')}>vs {rt.curSave} today</div></div>
        </div>
        <div>
          <input type="range" min={50} max={60} step={1} value={rt.retAge} onChange={vm.h.retireAge} aria-label="Retirement age" />
          <div style={sx('position:relative;height:26px;margin-top:-2px')}>
            {rt.timeline.map((t: any, i: number) => (<div key={i} style={sx(t.style)}>{t.age}</div>))}
          </div>
        </div>
        <div style={sx('display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid var(--color-divider);padding-top:14px')}>
          {rt.thresholds.map((t: any, i: number) => (
            <div key={i} style={sx('flex:1;min-width:150px')}>
              <div style={sx('font-size:11px;opacity:.55')}>Earliest viable at {t.pct}</div>
              <div style={sx('font-size:22px;font-family:var(--font-heading);font-variant-numeric:tabular-nums')}>{t.age}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={sx('padding:22px 24px;margin-bottom:24px;gap:12px')}>
        <div style={sx('display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Corpus path</h4>
          <span style={sx('font-size:11px;opacity:.55')}>Median with 10th–90th percentile band · {rt.simNote}</span>
        </div>
        <svg viewBox="0 0 900 260" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <path d={rt.band} fill="var(--color-accent-200)" opacity=".5"></path>
          <path d={rt.p50} fill="none" stroke="var(--color-accent-700)" strokeWidth="1.8"></path>
          <path d={rt.reqLine} fill="none" stroke="var(--color-text)" strokeWidth="1" strokeDasharray="4 4" opacity=".45"></path>
          <line x1={rt.retX} y1="0" x2={rt.retX} y2="220" stroke="var(--color-accent)" strokeWidth="1"></line>
          {rt.ticks.map((t: any, i: number) => (
            <text key={i} x={t.x} y="245" fontSize="11" fill="currentColor" opacity=".5" textAnchor="middle" fontFamily="var(--font-body)">{t.label}</text>
          ))}
          <text x={rt.retX} y="-6" fontSize="11" fill="var(--color-accent)" textAnchor="middle" fontFamily="var(--font-body)">retire {rt.retAge}</text>
        </svg>
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;margin-bottom:24px')}>
        <div className="card" style={sx('padding:20px 22px;gap:12px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Retirement spending</h4>
          <div style={sx('font-size:12px;opacity:.6')}>India living cost today, excluding travel and healthcare, which are modelled separately.</div>
          <div className="seg" style={sx('align-self:flex-start')}>
            <label className="seg-opt"><input type="radio" name="spendmode" value="Conservative" checked={rt.spendConservative} onChange={vm.h.spendMode} />Conservative</label>
            <label className="seg-opt"><input type="radio" name="spendmode" value="Base" checked={rt.spendBase} onChange={vm.h.spendMode} />Base</label>
            <label className="seg-opt"><input type="radio" name="spendmode" value="Comfortable" checked={rt.spendComfortable} onChange={vm.h.spendMode} />Comfortable</label>
          </div>
          {rt.spendRows.map((r: any, i: number) => (
            <div key={i} style={sx('display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--color-divider);font-size:13px')}>
              <span>{r.label}</span><span style={sx('font-variant-numeric:tabular-nums')}>{r.value}</span>
            </div>
          ))}
        </div>

        <div className="card" style={sx('padding:20px 22px;gap:12px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Travel &amp; healthcare</h4>
          <div style={sx('font-size:12px;opacity:.6')}>OMR 2,000/year of desired travel is already inside current monthly expenses — only the incremental budget is added, so nothing is double-counted.</div>
          <div className="seg" style={sx('align-self:flex-start')}>
            <label className="seg-opt"><input type="radio" name="travelmode" value="Fixed" checked={rt.travelFixed} onChange={vm.h.travelMode} />Fixed budget</label>
            <label className="seg-opt"><input type="radio" name="travelmode" value="Percent" checked={rt.travelPercent} onChange={vm.h.travelMode} />% of spend</label>
            <label className="seg-opt"><input type="radio" name="travelmode" value="Lifestyle" checked={rt.travelLifestyle} onChange={vm.h.travelMode} />Current lifestyle</label>
          </div>
          {rt.thRows.map((r: any, i: number) => (
            <div key={i} style={sx('display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--color-divider);font-size:13px')}>
              <span>{r.label}<span style={sx('font-size:10px;opacity:.5')}> {r.tag}</span></span><span style={sx('font-variant-numeric:tabular-nums')}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px')}>
        <div className="card" style={sx('padding:20px 22px;gap:12px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Return to India</h4>
          <div style={sx('font-size:12px;opacity:.6')}>Independent of retirement age. Before return, income and expenses are OMR; after, spending and withdrawals are INR.</div>
          <div style={sx('font-family:var(--font-heading);font-size:30px;font-variant-numeric:tabular-nums')}>Age {rt.returnAge}</div>
          <input type="range" min={50} max={60} step={1} value={rt.returnAge} onChange={vm.h.returnAge} aria-label="Return to India age" />
          {rt.returnRows.map((r: any, i: number) => (
            <div key={i} style={sx('display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--color-divider);font-size:13px')}>
              <span>{r.label}</span><span style={sx('font-variant-numeric:tabular-nums;opacity:.8')}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="card" style={sx('padding:20px 22px;gap:12px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Sequence-of-returns risk</h4>
          <div style={sx('font-size:12px;opacity:.6')}>A single {rt.shockLabel} equity-led drawdown, applied at different points around retirement.</div>
          {rt.seq.map((s: any, i: number) => (
            <div key={i} style={sx('display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:7px 0;border-bottom:1px solid var(--color-divider);font-size:13px;align-items:baseline')}>
              <span>{s.label}</span>
              <span style={sx('font-variant-numeric:tabular-nums;opacity:.7')}>{s.corpus}</span>
              <span style={sx('font-variant-numeric:tabular-nums;width:56px;text-align:right;' + s.css)}>{s.prob}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={sx('padding:20px 22px;margin-top:22px;gap:12px')}>
        <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Emergency reserve</h4>
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px')}>
          <div><div style={sx('font-size:11px;opacity:.55')}>Recommended</div><div style={sx('font-size:20px;font-variant-numeric:tabular-nums')}>{rt.emgRec}</div><div style={sx('font-size:11px;opacity:.5')}>{rt.emgMonths} months of expenses</div></div>
          <div><div style={sx('font-size:11px;opacity:.55')}>Currently held</div><div style={sx('font-size:20px;font-variant-numeric:tabular-nums')}>{rt.emgCur}</div><div style={sx('font-size:11px;opacity:.5')}>Cash + liquid fund</div></div>
          <div><div style={sx('font-size:11px;opacity:.55')}>Surplus / shortfall</div><div style={sx('font-size:20px;font-variant-numeric:tabular-nums;' + rt.emgCss)}>{rt.emgGap}</div><div style={sx('font-size:11px;opacity:.5')}>After retirement, hold primarily in INR savings</div></div>
        </div>
        {rt.emgDrivers.map((d: any, i: number) => (
          <div key={i} style={sx('display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;border-bottom:1px solid var(--color-divider)')}><span>{d.label}</span><span style={sx('font-variant-numeric:tabular-nums;opacity:.65')}>{d.value}</span></div>
        ))}
      </div>
    </div>
  );
}
