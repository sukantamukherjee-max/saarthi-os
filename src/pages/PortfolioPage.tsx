import { sx } from '../components/sx';

export default function PortfolioPage({ vm }: { vm: any }) {
  const pf = vm.pf;
  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Portfolio</h1>
      <p style={sx("font-size:13px;font-style:italic;color:color-mix(in srgb,var(--color-text) 58%,transparent);margin:0 0 24px;padding-bottom:14px;border-bottom:1px solid var(--color-divider)")}>{pf.rows.length} holdings · valued 24 Aug 2026 from a manual snapshot · 2 holdings require verification</p>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;margin-bottom:28px')}>
        <div className="card" style={sx('padding:22px;align-items:center;gap:16px')}>
          <svg viewBox="0 0 200 200" style={{ width: 200, height: 200, transform: 'rotate(-90deg)' }}>
            <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-neutral-200)" strokeWidth="22"></circle>
            {pf.segs.map((s: any, i: number) => (
              <circle key={i} cx="100" cy="100" r="70" fill="none" stroke={s.color} strokeWidth="22" strokeDasharray={s.dash} strokeDashoffset={s.offset} style={{ cursor: 'pointer', transition: 'stroke-width .2s' }} onClick={s.onClick}></circle>
            ))}
          </svg>
          <div style={sx('text-align:center;margin-top:-8px')}>
            <div style={sx('font-family:var(--font-heading);font-size:26px;font-variant-numeric:tabular-nums')}>{pf.total}</div>
            <div style={sx('font-size:11px;opacity:.55')}>{pf.totalINR}</div>
          </div>
        </div>
        <div className="card" style={sx('padding:8px 20px')}>
          {pf.classes.map((c: any, i: number) => (
            <div key={i} onClick={c.onClick} style={sx('display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--color-divider);cursor:pointer')}>
              <span style={sx(c.swatch)}></span>
              <div>
                <div style={sx('font-size:14px')}>{c.name}</div>
                <div style={sx('font-size:11px;opacity:.5')}>{c.risk} risk · {c.ccy}</div>
              </div>
              <div style={sx('text-align:right')}>
                <div style={sx('font-size:14px;font-variant-numeric:tabular-nums')}>{c.cur}</div>
                <div style={sx('font-size:11px;font-variant-numeric:tabular-nums;' + c.plCss)}>{c.pl} · {c.w}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pf.detail && (
        <div className="card elev-sm" style={sx('padding:20px 22px;margin-bottom:28px;gap:10px')}>
          <div style={sx('display:flex;align-items:center;justify-content:space-between')}>
            <h4 style={sx('margin:0;font-size:19px')}>{pf.detail.name}</h4>
            <button onClick={vm.h.closeClass} className="btn btn-ghost" style={sx('font-size:12px')}>Close</button>
          </div>
          <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px')}>
            <div><div style={sx('font-size:11px;opacity:.55')}>Invested</div><div style={sx('font-size:16px;font-variant-numeric:tabular-nums')}>{pf.detail.inv}</div></div>
            <div><div style={sx('font-size:11px;opacity:.55')}>Current</div><div style={sx('font-size:16px;font-variant-numeric:tabular-nums')}>{pf.detail.cur}</div></div>
            <div><div style={sx('font-size:11px;opacity:.55')}>Gain / loss</div><div style={sx('font-size:16px;font-variant-numeric:tabular-nums;' + pf.detail.plCss)}>{pf.detail.pl}</div></div>
            <div><div style={sx('font-size:11px;opacity:.55')}>Allocation</div><div style={sx('font-size:16px;font-variant-numeric:tabular-nums')}>{pf.detail.w}</div></div>
            <div><div style={sx('font-size:11px;opacity:.55')}>Volatility assumption</div><div style={sx('font-size:16px;font-variant-numeric:tabular-nums')}>{pf.detail.vol}</div></div>
            <div><div style={sx('font-size:11px;opacity:.55')}>Currency</div><div style={sx('font-size:16px')}>{pf.detail.ccy}</div></div>
          </div>
          <div style={sx('font-size:12.5px;color:color-mix(in srgb,var(--color-text) 65%,transparent);border-top:1px solid var(--color-divider);padding-top:10px')}>{pf.detail.note}</div>
        </div>
      )}

      <h4 style={sx('font-size:18px;font-weight:600;margin:0 0 10px')}>Holdings</h4>
      <div className="card" style={sx('padding:4px 16px;overflow-x:auto;margin-bottom:28px')}>
        <table className="table">
          <thead><tr><th>Asset</th><th>Quantity</th><th style={sx('text-align:right')}>Current</th><th style={sx('text-align:right')}>P/L</th><th style={sx('text-align:right')}>Alloc.</th><th>Risk</th><th>Recommendation</th></tr></thead>
          <tbody>
            {pf.rows.map((r: any, i: number) => (
              <tr key={i}>
                <td><div style={sx('font-size:13.5px')}>{r.n}</div><div style={sx('font-size:10.5px;opacity:.5')}>{r.c} · {r.fresh}</div></td>
                <td style={sx('font-size:12.5px;font-variant-numeric:tabular-nums')}>{r.q}</td>
                <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:13px')}>{r.cur}</td>
                <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:13px;' + r.plCss)}>{r.pl}</td>
                <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:13px')}>{r.w}</td>
                <td style={sx('font-size:12px;opacity:.7')}>{r.risk}</td>
                <td>
                  <div style={sx('display:flex;align-items:center;gap:7px;flex-wrap:wrap')}><span style={sx(r.recStyle)}>{r.rec}</span><span style={sx('font-size:10.5px;opacity:.55')}>{r.conf} confidence</span></div>
                  <div style={sx('font-size:11px;opacity:.6;max-width:34ch;margin-top:3px')}>{r.why}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px')}>
        <div className="card" style={sx('padding:20px 22px;gap:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Performance</h4>
          {pf.perf.map((p: any, i: number) => (
            <div key={i} style={sx('display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--color-divider)')}>
              <div><div style={sx('font-size:13px')}>{p.label}</div><div style={sx('font-size:10.5px;opacity:.5')}>{p.note}</div></div>
              <div style={sx('font-size:14px;font-variant-numeric:tabular-nums;' + p.css)}>{p.value}</div>
            </div>
          ))}
        </div>
        <div className="card" style={sx('padding:20px 22px;gap:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Benchmarks</h4>
          {pf.bench.map((b: any, i: number) => (
            <div key={i} style={sx('display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--color-divider)')}>
              <div style={sx('font-size:13px')}>{b.name}</div>
              <div style={sx('font-size:12px;opacity:.6;font-style:italic')}>{b.value}</div>
            </div>
          ))}
          <p style={sx('font-size:11.5px;color:color-mix(in srgb,var(--color-text) 55%,transparent);margin:6px 0 0')}>Benchmark and price series are not fabricated. Connect a market-data source or enter closing levels manually to activate relative performance and the custom allocation benchmark.</p>
        </div>
      </div>
    </div>
  );
}
