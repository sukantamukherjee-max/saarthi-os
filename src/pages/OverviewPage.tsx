import { sx } from '../components/sx';

export default function OverviewPage({ vm }: { vm: any }) {
  const ov = vm.ov;
  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <h1 style={sx('font-size:38px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Your Financial Picture</h1>
      <p style={sx('font-size:15px;max-width:60ch;color:color-mix(in srgb,var(--color-text) 68%,transparent);margin:0 0 6px')}>{ov.status}</p>
      <div style={sx('font-size:11px;color:color-mix(in srgb,var(--color-text) 45%,transparent);margin-bottom:26px')}>Assessed against your current assumptions · {ov.simNote}</div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2px;background:var(--color-divider);border:2px solid var(--color-text);border-radius:26px;overflow:hidden;margin-bottom:32px')}>
        <div style={sx('display:flex;flex-direction:column;gap:4px;padding:18px 20px;background:var(--pw-cell)')}>
          <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)')}>Total investable wealth</div>
          <div style={sx('font-family:var(--font-heading);font-weight:600;font-size:30px;line-height:1.1;font-variant-numeric:tabular-nums;letter-spacing:-.035em;white-space:nowrap')}>{ov.wealth}</div>
          <div style={sx('font-size:12px;color:color-mix(in srgb,var(--color-text) 58%,transparent);font-variant-numeric:tabular-nums')}>{ov.wealthINR}</div>
          <div style={sx('font-size:12px;margin-top:2px;color:#4c6b47;font-variant-numeric:tabular-nums')}>{ov.gain} since purchase</div>
        </div>
        <div style={sx('display:flex;flex-direction:column;gap:4px;padding:18px 20px;background:var(--pw-cell)')}>
          <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)')}>Retirement readiness</div>
          <div style={sx('font-family:var(--font-heading);font-weight:600;font-size:30px;line-height:1.1;font-variant-numeric:tabular-nums;letter-spacing:-.035em;white-space:nowrap')}>{ov.retProb}</div>
          <div style={sx('font-size:12px;color:color-mix(in srgb,var(--color-text) 58%,transparent)')}>Success probability at age {ov.retAge}</div>
          <div style={sx('font-size:12px;margin-top:2px;font-variant-numeric:tabular-nums')}>Earliest viable · age {ov.viable}</div>
        </div>
        <div style={sx('display:flex;flex-direction:column;gap:4px;padding:18px 20px;background:var(--pw-cell)')}>
          <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)')}>Education readiness</div>
          <div style={sx('font-family:var(--font-heading);font-weight:600;font-size:30px;line-height:1.1;font-variant-numeric:tabular-nums;letter-spacing:-.035em;white-space:nowrap')}>{ov.eduProb}</div>
          <div style={sx('font-size:12px;color:color-mix(in srgb,var(--color-text) 58%,transparent)')}>{ov.eduLine}</div>
          <div style={sx('font-size:12px;margin-top:2px;font-variant-numeric:tabular-nums')}>Need {ov.eduTotal}</div>
        </div>
        <div style={sx('display:flex;flex-direction:column;gap:4px;padding:18px 20px;background:var(--pw-cell)')}>
          <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)')}>Emergency reserve</div>
          <div style={sx('font-family:var(--font-heading);font-weight:600;font-size:30px;line-height:1.1;font-variant-numeric:tabular-nums;letter-spacing:-.035em;white-space:nowrap')}>{ov.emgCur}</div>
          <div style={sx('font-size:12px;color:color-mix(in srgb,var(--color-text) 58%,transparent)')}>Recommended {ov.emgRec} · {ov.emgMonths} months</div>
          <div style={sx('font-size:12px;margin-top:2px;font-variant-numeric:tabular-nums;' + ov.emgToneCss)}>{ov.emgGap}</div>
        </div>
        <div style={sx('display:flex;flex-direction:column;gap:4px;padding:18px 20px;background:var(--pw-cell)')}>
          <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)')}>Financial health</div>
          <div style={sx('font-family:var(--font-heading);font-weight:600;font-size:30px;line-height:1.1;font-variant-numeric:tabular-nums;letter-spacing:-.035em;white-space:nowrap')}>{ov.health}<span style={sx('font-size:15px;opacity:.5')}> / 100</span></div>
          <div style={sx('font-size:12px;color:color-mix(in srgb,var(--color-text) 58%,transparent)')}>{ov.healthWord}</div>
          <div style={sx('font-size:12px;margin-top:2px')}>Weakest: {ov.healthWeak}</div>
        </div>
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px;margin-bottom:30px')}>
        <div className="card" style={sx('padding:20px 22px;gap:14px')}>
          <div style={sx('display:flex;align-items:baseline;justify-content:space-between')}>
            <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Health score components</h4>
            <span style={sx('font-size:11px;color:color-mix(in srgb,var(--color-text) 48%,transparent)')}>0–100, higher is better</span>
          </div>
          {ov.bars.map((b: any, i: number) => (
            <div key={i} style={sx('display:grid;grid-template-columns:120px 1fr 40px;align-items:center;gap:12px')}>
              <div style={sx('font-size:13px')}>{b.label}</div>
              <div style={sx('height:4px;background:var(--pw-track);border-radius:999px;overflow:hidden')}><div style={sx(b.fill)}></div></div>
              <div style={sx('font-size:12px;text-align:right;font-variant-numeric:tabular-nums;opacity:.7')}>{b.val}</div>
            </div>
          ))}
        </div>

        <div className="card" style={sx('padding:20px 22px;gap:12px')}>
          <div style={sx('display:flex;align-items:baseline;justify-content:space-between')}>
            <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Retirement — one glance</h4>
            <span style={sx('font-size:11px;color:var(--color-accent)')}>{ov.retProb} success</span>
          </div>
          <div style={sx('display:grid;grid-template-columns:1fr 1fr;gap:12px 18px')}>
            <div><div style={sx('font-size:11px;opacity:.55')}>Target age</div><div style={sx('font-size:22px;font-family:var(--font-heading);font-variant-numeric:tabular-nums')}>{ov.retAge}</div></div>
            <div><div style={sx('font-size:11px;opacity:.55')}>Financially viable</div><div style={sx('font-size:22px;font-family:var(--font-heading);font-variant-numeric:tabular-nums')}>{ov.viable}</div></div>
            <div><div style={sx('font-size:11px;opacity:.55')}>Required corpus</div><div style={sx('font-size:16px;font-variant-numeric:tabular-nums')}>{ov.req}</div><div style={sx('font-size:11px;opacity:.5')}>{ov.reqINR}</div></div>
            <div><div style={sx('font-size:11px;opacity:.55')}>Projected corpus</div><div style={sx('font-size:16px;font-variant-numeric:tabular-nums')}>{ov.proj}</div><div style={sx('font-size:11px;opacity:.5')}>{ov.projINR}</div></div>
          </div>
          <div style={sx('margin-top:6px')}>
            <input type="range" min={50} max={60} step={1} value={ov.retAge} onChange={vm.h.retireAge} aria-label="Retirement age" />
            <div style={sx('position:relative;height:26px;margin-top:-2px')}>
              {ov.timeline.map((t: any, i: number) => (<div key={i} style={sx(t.style)}>{t.age}</div>))}
            </div>
          </div>
          <div style={sx('font-size:12px;color:color-mix(in srgb,var(--color-text) 60%,transparent);border-top:1px solid var(--color-divider);padding-top:10px')}>{ov.retNote}</div>
        </div>
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px')}>
        <div>
          <h4 style={sx('font-size:18px;font-weight:600;margin:0 0 12px')}>What needs your attention?</h4>
          <div style={sx('display:flex;flex-direction:column;gap:10px')}>
            {ov.attention.map((x: any, i: number) => (
              <div key={i} className="card" style={sx('padding:15px 18px;gap:5px;flex-direction:row;align-items:flex-start')}>
                <div style={sx('font-family:var(--font-heading);font-size:24px;font-weight:400;opacity:.28;line-height:1;width:26px;font-variant-numeric:tabular-nums')}>{x.n}</div>
                <div style={sx('flex:1;display:flex;flex-direction:column;gap:4px')}>
                  <div style={sx('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}><span style={sx('font-size:15px;font-family:var(--font-heading);font-weight:600')}>{x.title}</span><span style={sx(x.tagStyle)}>{x.tag}</span></div>
                  <div style={sx('font-size:13px;color:color-mix(in srgb,var(--color-text) 66%,transparent)')}>{x.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 style={sx('font-size:18px;font-weight:600;margin:0 0 12px')}>Next best actions</h4>
          <div className="card" style={sx('padding:6px 18px')}>
            {ov.actions.map((x: any, i: number) => (
              <div key={i} style={sx('display:flex;gap:12px;align-items:baseline;padding:11px 0;border-bottom:1px solid var(--color-divider)')}>
                <span style={sx('font-size:11px;color:var(--color-accent);font-variant-numeric:tabular-nums;width:14px')}>{x.n}</span>
                <span style={sx('font-size:13.5px;flex:1')}>{x.text}</span>
              </div>
            ))}
          </div>
          <p style={sx('font-size:11px;color:color-mix(in srgb,var(--color-text) 45%,transparent);margin-top:14px;line-height:1.5')}>Footnote — land at Durgapur, approximately ₹30 lakh. Illiquid asset, excluded from core financial planning. No appreciation, rental or development proceeds are modelled.</p>
        </div>
      </div>
    </div>
  );
}
