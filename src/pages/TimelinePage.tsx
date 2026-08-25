import { Fragment } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { sx } from '../components/sx';

const CLASS_KEYS = ['Indian Equity', 'US Equity', 'Crypto', 'Liquid Fund', 'Cash', 'Gold'];
const CHART_KEYS = [...CLASS_KEYS, 'FD (US/Crypto sale)'];
const CHART_COLORS: Record<string, string> = { 'Indian Equity': '#1d3fbf', 'US Equity': '#5c78d2', Crypto: '#d95e08', 'Liquid Fund': '#f4933f', Cash: '#9aaeea', Gold: '#fbd3ab', 'FD (US/Crypto sale)': '#2f9e6e' };

function fmtOMR(v: number) {
  return 'OMR ' + Math.round(v).toLocaleString('en-US');
}

export default function TimelinePage({ vm }: { vm: any }) {
  const dd = vm.dd;
  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <div style={sx('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:4px')}>
        <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0')}>Lifetime timeline</h1>
        <button className="btn btn-secondary" style={sx('font-size:12.5px;padding:8px 16px;min-height:0')} onClick={() => window.location.reload()}>Refresh</button>
      </div>
      <p style={sx('font-size:13px;font-style:italic;color:color-mix(in srgb,var(--color-text) 58%,transparent);margin:0 0 24px;padding-bottom:14px;border-bottom:1px solid var(--color-divider)')}>Every year from now (age {dd.currentAge}) to age {dd.planAge}. Contributions stop the moment you retire at {dd.retAge} — no inflow is shown after that age. Values switch from OMR to INR from age {dd.returnAge}, when you're back in India. Changed a portfolio value or an assumption elsewhere? Hit Refresh to recompute this page.</p>

      <div className="card" style={sx('padding:18px 22px;margin-bottom:22px;gap:10px')}>
        <div style={sx('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px')}>
          <div>
            <h4 style={sx('margin:0 0 2px;font-size:15px;font-weight:600')}>Life plan</h4>
            <p style={sx('margin:0;font-size:11.5px;opacity:.6')}>Changes the day-to-day spending level used every post-retirement year below.</p>
          </div>
          <div className="seg">
            <label className="seg-opt"><input type="radio" name="ddspendmode" value="Conservative" checked={dd.spendConservative} onChange={vm.h.spendMode} />Conservative</label>
            <label className="seg-opt"><input type="radio" name="ddspendmode" value="Base" checked={dd.spendBase} onChange={vm.h.spendMode} />Base</label>
            <label className="seg-opt"><input type="radio" name="ddspendmode" value="Comfortable" checked={dd.spendComfortable} onChange={vm.h.spendMode} />Comfortable</label>
          </div>
        </div>
      </div>

      {dd.depleteAge != null && (
        <div style={sx('display:flex;gap:10px;align-items:center;padding:10px 14px;border:1px solid var(--pw-neg);border-radius:var(--radius-md);margin-bottom:22px;font-size:12.5px;background:color-mix(in srgb,var(--pw-neg) 8%,transparent)')}>
          <span style={sx('font-weight:600;color:var(--pw-neg)')}>Portfolio depletes at age {dd.depleteAge}</span>
          <span style={sx('opacity:.75')}>on this life plan and the model's expected (median) return — not a worst case.</span>
        </div>
      )}

      <div className="card" style={sx('padding:20px 22px;margin-bottom:24px;gap:12px')}>
        <div style={sx('display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Portfolio composition over time</h4>
          <span style={sx('font-size:11px;opacity:.55')}>Each asset class compounding at its own assumed return · OMR</span>
        </div>
        {dd.chart.length === 0 ? (
          <div style={sx('font-size:12.5px;opacity:.6')}>No holdings yet — add your portfolio to see this projection.</div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={dd.chart} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-divider)" vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.55 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : (v / 1e3).toFixed(0) + 'k'} />
              <Tooltip formatter={(value: number) => fmtOMR(value)} labelFormatter={(age) => 'Age ' + age} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)', borderRadius: 8, fontSize: 12 }} />
              <Legend
                verticalAlign="top"
                height={44}
                content={() => (
                  <ul style={sx('display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;list-style:none;padding:0;margin:0 0 8px')}>
                    {CHART_KEYS.map((k) => (
                      <li key={k} style={sx('display:flex;align-items:center;gap:5px')}>
                        <span style={sx(`width:10px;height:10px;border-radius:2px;background:${CHART_COLORS[k]};display:inline-block;flex-shrink:0`)}></span>
                        <span style={sx('font-size:11px;opacity:.75')}>{k}</span>
                      </li>
                    ))}
                  </ul>
                )}
              />
              {CHART_KEYS.map((k) => (
                <Area key={k} type="monotone" dataKey={k} stackId="1" fill={CHART_COLORS[k]} fillOpacity={0.85} strokeWidth={0.5} stroke="var(--color-surface)" />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card" style={sx('padding:4px 16px;overflow:auto;max-height:70vh;margin-bottom:28px')}>
        <table className="table">
          <thead>
            <tr>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1')}>Age</th>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1')}>Ccy</th>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>Contribution</th>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>Living</th>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>Travel</th>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>Healthcare</th>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>Education</th>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>Marriage</th>
              {CLASS_KEYS.map((k) => (<th key={k} style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>{k}</th>))}
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>FD (US/Crypto sale)</th>
              <th style={sx('position:sticky;top:0;background:var(--color-surface);z-index:1;text-align:right')}>Portfolio end</th>
            </tr>
          </thead>
          <tbody>
            {dd.rows.map((r: any, i: number) => (
              <Fragment key={i}>
                {r.liquidatedNote && (
                  <tr key={i + '-note'}>
                    <td colSpan={9 + CLASS_KEYS.length} style={sx('background:color-mix(in srgb,var(--pw-pos) 10%,transparent);font-size:11.5px;color:var(--pw-pos);padding:6px 10px')}>{r.liquidatedNote}</td>
                  </tr>
                )}
                <tr key={i} style={sx(r.depleted ? 'background:color-mix(in srgb,var(--pw-neg) 8%,transparent)' : '')}>
                  <td style={sx('font-size:12.5px;font-variant-numeric:tabular-nums')}>{r.age}<div style={sx('font-size:10px;opacity:.5')}>{r.phase}</div></td>
                  <td style={sx('font-size:10.5px;opacity:.6')}>{r.ccy}</td>
                  <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;color:var(--pw-pos)')}>{r.contrib || '—'}</td>
                  <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;opacity:.8')}>{r.living || '—'}</td>
                  <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;opacity:.8')}>{r.travel || '—'}</td>
                  <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;opacity:.8')}>{r.health || '—'}</td>
                  <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;opacity:.8')}>{r.edu || '—'}</td>
                  <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;opacity:.8')}>{r.mar || '—'}</td>
                  {r.byClass.map((c: any, ci: number) => (
                    <td key={ci} style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px')}>{c.value}</td>
                  ))}
                  <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:12.5px;color:#2f9e6e')}>{r.fd}</td>
                  <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:13px;font-weight:600;' + (r.depleted ? 'color:var(--pw-neg)' : ''))}>{r.depleted ? 'Depleted' : r.end}</td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={sx('padding:20px 22px 8px;margin-bottom:24px;gap:4px')}>
        <div style={sx('display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Cash flow ledger</h4>
          <span style={sx('font-size:11px;opacity:.55')}>Age in the middle · money coming in on the left (working years) · money going out on the right (retirement + education/marriage)</span>
        </div>
        <div style={sx('display:grid;grid-template-columns:1fr 56px 1fr;column-gap:10px')}>
          {dd.ledger.map((r: any, i: number) => (
            <div key={i} style={sx('display:contents')}>
              <div style={sx('display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:3px 0')}>
                {r.inflowStr && (<span style={sx('font-size:11px;font-variant-numeric:tabular-nums;color:var(--pw-pos);white-space:nowrap')}>{r.inflowStr}</span>)}
                <div style={sx(`height:9px;border-radius:3px 0 0 3px;background:var(--pw-pos);opacity:.75;width:${Math.round((r.inflow / dd.maxInflow) * 100)}%`)}></div>
              </div>
              <div style={sx('text-align:center;font-size:11px;font-variant-numeric:tabular-nums;opacity:.7;padding:3px 0;border-left:1px solid var(--color-divider);border-right:1px solid var(--color-divider)')}>{r.age}</div>
              <div style={sx('display:flex;align-items:center;gap:8px;padding:3px 0')}>
                <div style={sx(`height:9px;border-radius:0 3px 3px 0;background:var(--pw-neg);opacity:.75;width:${Math.round((r.outflow / dd.maxOutflow) * 100)}%`)}></div>
                {r.outflowStr && (<span style={sx('font-size:11px;font-variant-numeric:tabular-nums;color:var(--pw-neg);white-space:nowrap')}>{r.outflowStr}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={sx('font-size:11.5px;color:color-mix(in srgb,var(--color-text) 55%,transparent)')}>Expected-return (median) path — actual markets will move this above or below the line shown. Each asset class grows at its own assumed return from Assumptions; contributions and withdrawals are split across classes in proportion to that year's weights, the same constant-mix assumption used everywhere else in this app. See the Retirement page for the percentile band and stress tests.</p>
    </div>
  );
}
