import { sx } from '../components/sx';

export default function RiskPage({ vm }: { vm: any }) {
  const rk = vm.rk;
  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Risk</h1>
      <p style={sx('font-size:13px;font-style:italic;color:color-mix(in srgb,var(--color-text) 58%,transparent);margin:0 0 24px;padding-bottom:14px;border-bottom:1px solid var(--color-divider)')}>Portfolio and plan risk, with the drivers behind the score</p>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;margin-bottom:24px')}>
        <div className="card" style={sx('padding:22px 24px;gap:14px')}>
          <div style={sx('display:flex;align-items:baseline;gap:12px')}>
            <div style={sx('font-family:var(--font-heading);font-size:46px;font-variant-numeric:tabular-nums;line-height:1')}>{rk.score}</div>
            <div><div style={sx('font-size:15px')}>{rk.word}</div><div style={sx('font-size:11px;opacity:.5')}>Composite risk, 0 calm – 100 severe</div></div>
          </div>
          {rk.drivers.map((d: any, i: number) => (
            <div key={i} style={sx('display:grid;grid-template-columns:120px 1fr 76px;gap:10px;align-items:center')}>
              <div style={sx('font-size:12.5px')}>{d.label}</div>
              <div style={sx('height:4px;background:var(--pw-track);border-radius:999px;overflow:hidden')}><div style={sx(d.fill)}></div></div>
              <div style={sx('font-size:11px;text-align:right;font-variant-numeric:tabular-nums;opacity:.65;white-space:nowrap')}>{d.val}</div>
            </div>
          ))}
        </div>
        <div className="card" style={sx('padding:22px 24px;gap:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Concentration &amp; exposure</h4>
          {rk.expo.map((e: any, i: number) => (
            <div key={i} style={sx('display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--color-divider)')}>
              <div><div style={sx('font-size:13px')}>{e.label}</div><div style={sx('font-size:10.5px;opacity:.5')}>{e.note}</div></div>
              <div style={sx('font-size:13.5px;font-variant-numeric:tabular-nums;' + (e.css || ''))}>{e.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px')}>
        <div className="card" style={sx('padding:20px 22px;gap:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Market stress tests</h4>
          <div style={sx('font-size:12px;opacity:.6')}>Scenarios selected from your actual composition. Each shows the immediate hit to wealth and the resulting retirement success probability.</div>
          {rk.stress.map((s: any, i: number) => (
            <div key={i} style={sx('display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--color-divider);font-size:13px')}>
              <span>{s.label}</span>
              <span style={sx('font-variant-numeric:tabular-nums;opacity:.65')}>{s.hit}</span>
              <span style={sx('font-variant-numeric:tabular-nums;width:52px;text-align:right;' + s.css)}>{s.prob}</span>
            </div>
          ))}
        </div>
        <div className="card" style={sx('padding:20px 22px;gap:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Crypto</h4>
          <div style={sx('font-size:12px;opacity:.6')}>No fixed allocation cap is imposed. Exposure is measured, and concentration is flagged when it materially drives plan outcomes.</div>
          {rk.crypto.map((c: any, i: number) => (
            <div key={i} style={sx('display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--color-divider);font-size:13px')}>
              <div><div>{c.label}</div><div style={sx('font-size:10.5px;opacity:.5')}>{c.note}</div></div>
              <div style={sx('font-variant-numeric:tabular-nums;' + (c.css || ''))}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={sx('padding:20px 22px;margin-top:22px;gap:10px')}>
        <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Salary interruption</h4>
        <div style={sx('overflow-x:auto')}>
          <table className="table" style={sx('font-size:13px')}>
            <thead><tr><th>Scenario</th><th style={sx('text-align:right')}>Emergency fund used</th><th style={sx('text-align:right')}>Portfolio drawn</th><th style={sx('text-align:right')}>Contributions lost</th><th style={sx('text-align:right')}>Retirement probability</th></tr></thead>
            <tbody>
              {rk.jobloss.map((j: any, i: number) => (
                <tr key={i}><td>{j.label}</td><td style={sx('text-align:right;font-variant-numeric:tabular-nums')}>{j.emg}</td><td style={sx('text-align:right;font-variant-numeric:tabular-nums')}>{j.port}</td><td style={sx('text-align:right;font-variant-numeric:tabular-nums')}>{j.contrib}</td><td style={sx('text-align:right;font-variant-numeric:tabular-nums;' + j.css)}>{j.prob}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
