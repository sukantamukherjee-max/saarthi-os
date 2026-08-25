import { sx } from '../components/sx';

export default function EducationPage({ vm }: { vm: any }) {
  const ed = vm.ed;
  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Education</h1>
      <p style={sx("font-size:13px;font-style:italic;color:color-mix(in srgb,var(--color-text) 58%,transparent);margin:0 0 24px;padding-bottom:14px;border-bottom:1px solid var(--color-divider)")}>Daughter age {ed.dAge} · base planning currency OMR while earning in Oman · costs are research-based estimates, not quotes</p>

      <div className="card" style={sx('padding:22px 24px;margin-bottom:22px;gap:16px')}>
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:20px;align-items:start')}>
          <div>
            <div style={sx('font-size:11px;opacity:.55;margin-bottom:2px')}>Undergraduate start age</div>
            <div style={sx('font-family:var(--font-heading);font-size:30px;font-variant-numeric:tabular-nums')}>{ed.startAge}</div>
            <input type="range" min={17} max={22} step={1} value={ed.startAge} onChange={vm.h.eduStart} aria-label="Education start age" />
            <div style={sx('font-size:11px;opacity:.5')}>Begins in {ed.startsIn} years, when you are {ed.parentAge}</div>
          </div>
          <div>
            <div style={sx('font-size:11px;opacity:.55;margin-bottom:6px')}>University tier</div>
            <div className="seg">
              <label className="seg-opt"><input type="radio" name="tier" value="Budget" checked={ed.tierBudget} onChange={vm.h.eduTier} />Budget</label>
              <label className="seg-opt"><input type="radio" name="tier" value="Mainstream" checked={ed.tierMainstream} onChange={vm.h.eduTier} />Mainstream</label>
              <label className="seg-opt"><input type="radio" name="tier" value="Premium" checked={ed.tierPremium} onChange={vm.h.eduTier} />Premium</label>
            </div>
            <label style={sx('display:flex;align-items:center;gap:8px;font-size:13px;margin-top:14px;cursor:pointer')}>
              <input type="checkbox" checked={ed.pg} onChange={vm.h.eduPG} style={{ accentColor: 'var(--color-accent)', width: 15, height: 15 }} />
              Include postgraduate study
            </label>
            <div style={sx('font-size:11px;opacity:.5;margin-top:4px')}>PG is not assumed by default — it depends on the path chosen later.</div>
          </div>
        </div>
        <div style={sx('border-top:1px solid var(--color-divider);padding-top:16px')}>
          <div style={sx('font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:10px')}>Undergraduate country</div>
          <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px')}>
            {ed.countries.map((c: any, i: number) => (
              <div key={i} onClick={c.onClick} style={sx(c.style)}>
                <div style={sx('font-size:15px;font-family:var(--font-heading);font-weight:600')}>{c.name}</div>
                <div style={sx('font-size:11px;opacity:.55')}>{c.years} · {c.annual}/yr today</div>
                <div style={sx('font-size:15px;font-variant-numeric:tabular-nums;margin-top:6px')}>{c.total}</div>
                <div style={sx('font-size:11px;opacity:.5;font-variant-numeric:tabular-nums')}>{c.totalINR}</div>
              </div>
            ))}
          </div>
        </div>

        {ed.pg && (
          <div style={sx('border-top:1px solid var(--color-divider);padding-top:16px')}>
            <div style={sx('font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:2px')}>Postgraduate country</div>
            <div style={sx('font-size:11px;opacity:.5;margin-bottom:10px')}>Can be different from undergraduate — e.g. India for UG, abroad for PG.</div>
            <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px')}>
              {ed.pgCountries.map((c: any, i: number) => (
                <div key={i} onClick={c.onClick} style={sx(c.style)}>
                  <div style={sx('font-size:15px;font-family:var(--font-heading);font-weight:600')}>{c.name}</div>
                  <div style={sx('font-size:11px;opacity:.55')}>{c.years} · {c.annual}/yr today</div>
                  <div style={sx('font-size:15px;font-variant-numeric:tabular-nums;margin-top:6px')}>{c.total}</div>
                  <div style={sx('font-size:11px;opacity:.5;font-variant-numeric:tabular-nums')}>{c.totalINR}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px;margin-bottom:22px')}>
        <div className="card" style={sx('padding:20px 22px;gap:8px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Annual cost breakdown{ed.mixedCountries ? ' (Undergraduate)' : ''}</h4>
          <div style={sx('font-size:12px;opacity:.6')}>{ed.country} · {ed.tier} · today's money, {ed.ccy}{ed.mixedCountries ? ' · PG in ' + ed.pgCountry + ' (' + ed.pgCcy + ') shown in Year by year below' : ''}</div>
          <div style={sx('overflow-x:auto')}>
            <table className="table" style={sx('font-size:13px')}>
              <thead><tr><th>Component</th><th style={sx('text-align:right')}>{ed.ccy}</th><th style={sx('text-align:right')}>OMR</th><th style={sx('text-align:right')}>INR</th></tr></thead>
              <tbody>
                {ed.breakdown.map((b: any, i: number) => (
                  <tr key={i}><td>{b.name}</td><td style={sx('text-align:right;font-variant-numeric:tabular-nums')}>{b.local}</td><td style={sx('text-align:right;font-variant-numeric:tabular-nums')}>{b.omr}</td><td style={sx('text-align:right;font-variant-numeric:tabular-nums')}>{b.inr}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card" style={sx('padding:20px 22px;gap:10px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Year by year</h4>
          {ed.lines.map((l: any, i: number) => (
            <div key={i} style={sx('display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--color-divider);font-size:13px')}>
              <span style={sx('font-size:11px;opacity:.5;width:62px')}>{l.when}</span>
              <span>{l.kind} · age {l.dAge}<span style={sx('font-size:11px;opacity:.5')}> ({l.local})</span></span>
              <span style={sx('font-variant-numeric:tabular-nums')}>{l.omr}</span>
            </div>
          ))}
          <div style={sx('display:flex;justify-content:space-between;padding-top:10px;font-size:15px')}>
            <span>Total, inflated to the year of spend</span><span style={sx('font-variant-numeric:tabular-nums')}>{ed.total}</span>
          </div>
          <div style={sx('font-size:11px;opacity:.5;text-align:right;font-variant-numeric:tabular-nums')}>{ed.totalINR} · {ed.totalLocal}</div>
          <div style={sx('font-size:11.5px;opacity:.6;border-top:1px solid var(--color-divider);padding-top:10px')}>Currency risk is live: a 10% adverse move in the education currency against OMR adds {ed.fxRisk} to the requirement.</div>
        </div>
      </div>

      <div>
        <h4 style={sx('font-size:18px;font-weight:600;margin:0 0 12px')}>Funding scenarios</h4>
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px')}>
          {ed.scenarios.map((s: any, i: number) => (
            <div key={i} className="card" style={sx('padding:18px 20px;gap:8px')}>
              <div style={sx('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent)')}>{s.kicker}</div>
              <div style={sx('font-family:var(--font-heading);font-size:19px;font-weight:600')}>{s.name}</div>
              <div style={sx('font-size:12.5px;color:color-mix(in srgb,var(--color-text) 66%,transparent);min-height:56px')}>{s.body}</div>
              <div style={sx('display:flex;justify-content:space-between;font-size:12.5px;border-top:1px solid var(--color-divider);padding-top:8px')}><span>Education cost</span><span style={sx('font-variant-numeric:tabular-nums')}>{s.cost}</span></div>
              <div style={sx('display:flex;justify-content:space-between;font-size:12.5px')}><span>Retirement probability</span><span style={sx('font-variant-numeric:tabular-nums;' + s.css)}>{s.prob}</span></div>
              <div style={sx('display:flex;justify-content:space-between;font-size:12.5px')}><span>Retirement age impact</span><span style={sx('font-variant-numeric:tabular-nums')}>{s.ageImpact}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
