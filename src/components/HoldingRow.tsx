import { useState } from 'react';
import { sx } from './sx';
import { useHoldingEditor } from '../hooks/useHoldingEditor';

export default function HoldingRow({ r }: { r: any }) {
  const { updateHolding, deleteHolding } = useHoldingEditor();
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [name, setName] = useState(r.n);
  const [cur, setCur] = useState(String(r.curRaw));
  const [inv, setInv] = useState(String(r.invRaw));
  const [qty, setQty] = useState(r.q === '—' ? '' : r.q);
  const [ticker, setTicker] = useState(r.ticker || '');
  const [busy, setBusy] = useState(false);

  const editable = !!r.id;

  async function save() {
    const curVal = Number(cur.replace(/,/g, ''));
    const invVal = Number(inv.replace(/,/g, ''));
    if (!name.trim() || !Number.isFinite(curVal) || curVal < 0 || !Number.isFinite(invVal) || invVal < 0) return;
    setBusy(true);
    await updateHolding(r.id, { name: name.trim(), currentValueOMR: curVal, investedOMR: invVal, quantityLabel: qty.trim() || '—', ticker: ticker.trim() });
  }

  async function confirmDelete() {
    setBusy(true);
    await deleteHolding(r.id);
  }

  if (mode === 'edit') {
    return (
      <tr>
        <td colSpan={5} style={sx('padding:12px 8px')}>
          <div style={sx('display:flex;gap:10px;flex-wrap:wrap;align-items:center')}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={sx('flex:2;min-width:140px;height:34px;padding:0 10px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-text);font-size:12.5px')} />
            <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" style={sx('flex:1;min-width:90px;height:34px;padding:0 10px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-text);font-size:12.5px')} />
            <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="Ticker (e.g. AAPL, BAJFINANCE.NS)" style={sx('flex:1;min-width:150px;height:34px;padding:0 10px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-text);font-size:12.5px')} />
            <label style={sx('display:flex;align-items:center;gap:5px;font-size:11px;opacity:.6')}>Current
              <input type="number" min="0" step="0.01" value={cur} onChange={(e) => setCur(e.target.value)} style={sx('width:110px;height:34px;padding:0 8px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-text);font-size:12.5px;font-variant-numeric:tabular-nums')} />
            </label>
            <label style={sx('display:flex;align-items:center;gap:5px;font-size:11px;opacity:.6')}>Invested
              <input type="number" min="0" step="0.01" value={inv} onChange={(e) => setInv(e.target.value)} style={sx('width:110px;height:34px;padding:0 8px;border:1px solid var(--color-divider);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-text);font-size:12.5px;font-variant-numeric:tabular-nums')} />
            </label>
            <button className="btn btn-primary" style={sx('font-size:11.5px;padding:6px 12px;min-height:0')} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
            <button className="btn btn-ghost" style={sx('font-size:11.5px;padding:6px 12px;min-height:0')} disabled={busy} onClick={() => setMode('view')}>Cancel</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td><div style={sx('font-size:13.5px')}>{r.n}</div><div style={sx('font-size:10.5px;opacity:.5')}>{r.c} · {r.fresh}{r.ticker ? ' · ' + r.ticker : ''}</div></td>
      <td style={sx('font-size:12.5px;font-variant-numeric:tabular-nums')}>{r.q}</td>
      <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:13px')}>{r.cur}</td>
      <td style={sx('text-align:right;font-variant-numeric:tabular-nums;font-size:13px;' + r.plCss)}>{r.pl}</td>
      <td>
        {editable && (
          mode === 'delete' ? (
            <div style={sx('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
              <span style={sx('font-size:11px;color:var(--pw-neg)')}>Remove?</span>
              <button className="btn btn-primary" style={sx('font-size:11px;padding:3px 9px;min-height:0')} disabled={busy} onClick={confirmDelete}>{busy ? 'Removing…' : 'Confirm'}</button>
              <button className="btn btn-ghost" style={sx('font-size:11px;padding:3px 9px;min-height:0')} disabled={busy} onClick={() => setMode('view')}>Cancel</button>
            </div>
          ) : (
            <div style={sx('display:flex;gap:12px')}>
              <button onClick={() => setMode('edit')} style={sx('background:none;border:0;padding:0;cursor:pointer;font-size:11px;color:var(--color-accent);text-decoration:underline')}>Edit</button>
              <button onClick={() => setMode('delete')} style={sx('background:none;border:0;padding:0;cursor:pointer;font-size:11px;color:var(--pw-neg);text-decoration:underline')}>Delete</button>
            </div>
          )
        )}
      </td>
    </tr>
  );
}
