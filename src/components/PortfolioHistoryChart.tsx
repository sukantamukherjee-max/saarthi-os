import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { sx } from './sx';
import { useAuth } from '../hooks/useAuth';
import { usePortfolioHistory } from '../hooks/usePortfolioHistory';

const TRACKED: { key: string; label: string }[] = [
  { key: 'Indian Equity', label: 'Indian Equity' },
  { key: 'US Equity', label: 'US Equity' },
  { key: 'Crypto', label: 'Crypto' },
];

function fmtOMR(v: number) {
  return 'OMR ' + Math.round(v).toLocaleString('en-US');
}

export default function PortfolioHistoryChart() {
  const { user } = useAuth();
  const { enabled, loading, byClass } = usePortfolioHistory(user?.id ?? null);

  if (!enabled) return null;

  const hasAnyHistory = TRACKED.some((t) => (byClass[t.key] || []).length > 0);

  return (
    <div className="card" style={sx('padding:20px 22px;gap:14px;margin-top:22px')}>
      <div style={sx('display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px')}>
        <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Value over time</h4>
        <span style={sx('font-size:11px;opacity:.55')}>Invested vs current, per asset class · recorded on every upload, edit or live price refresh</span>
      </div>
      {loading && <div style={sx('font-size:12.5px;opacity:.6')}>Loading history…</div>}
      {!loading && !hasAnyHistory && (
        <div style={sx('font-size:12.5px;opacity:.6')}>No history yet — each time you upload and merge holdings for Indian Equity, US Equity, or Crypto, a data point is recorded here.</div>
      )}
      {!loading && hasAnyHistory && (
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px')}>
          {TRACKED.map((t) => {
            const points = byClass[t.key] || [];
            return (
              <div key={t.key}>
                <div style={sx('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px')}>
                  <span style={sx('font-size:13px;font-weight:600')}>{t.label}</span>
                  {points.length > 0 && (
                    <span style={sx('font-size:11px;font-variant-numeric:tabular-nums;' + (points[points.length - 1].current >= points[points.length - 1].invested ? 'color:var(--pw-pos)' : 'color:var(--pw-neg)'))}>
                      {fmtOMR(points[points.length - 1].current)}
                    </span>
                  )}
                </div>
                {!points.length ? (
                  <div style={sx('font-size:11.5px;opacity:.5;height:140px;display:flex;align-items:center;justify-content:center;border:1px dashed var(--color-divider);border-radius:var(--radius-md)')}>No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id={'cur-' + t.key.replace(/\s/g, '')} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="var(--color-divider)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.55 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        formatter={(value: number, name: string) => [fmtOMR(value), name === 'current' ? 'Current' : 'Invested']}
                        contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)', borderRadius: 8, fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="invested" stroke="var(--color-text)" strokeOpacity={0.4} strokeDasharray="3 3" fill="none" dot={false} />
                      <Area type="monotone" dataKey="current" stroke="var(--color-accent)" strokeWidth={2} fill={'url(#cur-' + t.key.replace(/\s/g, '') + ')'} dot={{ r: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
