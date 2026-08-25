import { useMemo, useState } from 'react';
import { sx } from '../components/sx';
import PortfolioHistoryChart from '../components/PortfolioHistoryChart';
import HoldingRow from '../components/HoldingRow';
import { useAuth } from '../hooks/useAuth';
import { usePriceRefresh } from '../hooks/usePriceRefresh';
import { useBenchmarks } from '../hooks/useBenchmarks';

export default function PortfolioPage({ vm }: { vm: any }) {
  const pf = vm.pf;
  const [tab, setTab] = useState('All');
  const classes = useMemo(() => ['All', ...Array.from(new Set(pf.rows.map((r: any) => r.c)))] as string[], [pf.rows]);
  const visibleRows = tab === 'All' ? pf.rows : pf.rows.filter((r: any) => r.c === tab);
  const lowConfCount = pf.rows.filter((r: any) => r.conf === 'Low').length;

  const { user } = useAuth();
  const { refreshing, result, refreshAll } = usePriceRefresh(user?.id ?? null);
  const { quotes: benchQuotes } = useBenchmarks();

  async function handleRefresh() {
    const holdings = pf.rows.map((r: any) => ({ id: r.id, n: r.n, c: r.c, q: r.q, ticker: r.ticker, isDemo: r.isDemo }));
    const outcome = await refreshAll(holdings);
    // Only reload (which discards the result banner) when something actually
    // changed — otherwise the user needs to see the skip reasons in place.
    if (outcome && outcome.updated > 0) window.location.reload();
  }

  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <div style={sx('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:4px')}>
        <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0')}>Portfolio</h1>
        <button className="btn btn-secondary" style={sx('font-size:12.5px;padding:8px 16px;min-height:0')} disabled={refreshing} onClick={handleRefresh}>
          {refreshing ? 'Refreshing…' : '↻ Refresh live prices'}
        </button>
      </div>
      <p style={sx("font-size:13px;font-style:italic;color:color-mix(in srgb,var(--color-text) 58%,transparent);margin:0 0 8px;padding-bottom:14px;border-bottom:1px solid var(--color-divider)")}>{pf.rows.length} holdings · valued 24 Aug 2026 from a manual snapshot{lowConfCount > 0 ? ` · ${lowConfCount} holding${lowConfCount > 1 ? 's' : ''} require verification` : ''}</p>
      {result && (
        <div style={sx('font-size:12px;padding:10px 14px;border:1px dashed var(--color-divider);border-radius:var(--radius-md);margin-bottom:20px')}>
          <div style={sx(`opacity:.75;margin-bottom:${result.skipped.length ? 4 : 0}px`)}>Updated {result.updated} holding(s) with a live price{result.updated > 0 ? ' — reloading…' : '.'}</div>
          {result.skipped.length > 0 && (
            <details>
              <summary style={sx('cursor:pointer;opacity:.6')}>{result.skipped.length} holding(s) couldn't be refreshed — why</summary>
              <ul style={sx('margin:6px 0 0;padding-left:18px;opacity:.65')}>
                {result.skipped.map((s, i) => (<li key={i}>{s.name}: {s.reason}</li>))}
              </ul>
            </details>
          )}
        </div>
      )}

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
      <div style={sx('display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px')}>
        {classes.map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={tab === c ? 'btn btn-primary' : 'btn btn-secondary'}
            style={sx('font-size:12px;padding:6px 14px;min-height:0')}
          >
            {c}{c !== 'All' && ' (' + pf.rows.filter((r: any) => r.c === c).length + ')'}
          </button>
        ))}
      </div>
      <div className="card" style={sx('padding:4px 16px;overflow-x:auto;margin-bottom:28px')}>
        <table className="table">
          <thead><tr><th>Asset</th><th>Quantity</th><th style={sx('text-align:right')}>Current</th><th style={sx('text-align:right')}>P/L</th><th></th></tr></thead>
          <tbody>
            {visibleRows.map((r: any, i: number) => (
              <HoldingRow key={r.id || i} r={r} />
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
          {pf.bench.map((b: any, i: number) => {
            const live = benchQuotes[b.name];
            return (
              <div key={i} style={sx('display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--color-divider)')}>
                <div style={sx('font-size:13px')}>{b.name}</div>
                {live ? (
                  <div style={sx('font-size:13px;font-variant-numeric:tabular-nums')}>${live.price.toFixed(2)} <span style={sx('font-size:10.5px;opacity:.5')}>{b.name === 'S&P 500' ? 'SPY proxy' : 'QQQ proxy'}</span></div>
                ) : (
                  <div style={sx('font-size:12px;opacity:.6;font-style:italic')}>{b.value}</div>
                )}
              </div>
            );
          })}
          <p style={sx('font-size:11.5px;color:color-mix(in srgb,var(--color-text) 55%,transparent);margin:6px 0 0')}>S&amp;P 500 / Nasdaq 100 shown via SPY/QQQ ETF proxy prices. Nifty benchmarks and the custom allocation benchmark have no free live source wired in yet — nothing here is fabricated.</p>
        </div>
      </div>

      <PortfolioHistoryChart />
    </div>
  );
}
