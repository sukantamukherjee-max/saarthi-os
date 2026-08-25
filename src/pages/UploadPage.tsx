import { useState } from 'react';
import { sx } from '../components/sx';
import Hoverable from '../components/Hoverable';
import { useAuth } from '../hooks/useAuth';
import { useUploads, type MergeDiff, type UploadRow } from '../hooks/useUploads';

export default function UploadPage({ vm }: { vm: any }) {
  const up = vm.up;
  const { user } = useAuth();
  const { enabled, rows, busy, processFiles, previewMerge, commitMerge } = useUploads(user?.id ?? null);
  const [preview, setPreview] = useState<{ row: UploadRow; diff: MergeDiff } | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const pending = rows.filter((r) => r.status !== 'merged');

  async function startPreview(row: UploadRow) {
    setPreviewing(row.id);
    const diff = await previewMerge(row);
    setPreviewing(null);
    setPreview({ row, diff });
  }

  return (
    <div style={sx('animation:pwFade .35s ease both')}>
      <h1 style={sx('font-size:34px;font-weight:400;letter-spacing:-.02em;margin:0 0 4px')}>Upload portfolio</h1>
      <p style={sx('font-size:13px;font-style:italic;color:color-mix(in srgb,var(--color-text) 58%,transparent);margin:0 0 24px;padding-bottom:14px;border-bottom:1px solid var(--color-divider)')}>Excel, CSV, PDF statements or screenshots. Nothing is guessed — unclear values are queued for your review.</p>
      {!enabled && (
        <div style={sx('font-size:12.5px;padding:10px 14px;border:1px dashed var(--color-divider);border-radius:var(--radius-md);margin-bottom:20px;opacity:.7')}>
          Sign in to upload files — uploads are tied to your account so they stay private.
        </div>
      )}
      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-bottom:26px')}>
        {up.zones.map((z: any, i: number) => (
          <Hoverable
            key={i}
            as="label"
            style="display:flex;flex-direction:column;gap:8px;padding:30px 22px;border:1px dashed var(--color-divider);border-radius:var(--radius-md);cursor:pointer;text-align:center;align-items:center"
            hoverStyle="border-color:var(--color-accent);background:var(--color-accent-100)"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M8 8l4-4 4 4"></path><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg>
            <div style={sx('font-family:var(--font-heading);font-size:17px;font-weight:600')}>{z.name}</div>
            <div style={sx('font-size:11.5px;opacity:.55')}>{z.hint}</div>
            <div style={sx('font-size:11.5px;color:var(--color-accent)')}>{z.status}</div>
            <input
              type="file"
              multiple
              disabled={!enabled}
              onChange={(e) => { z.onChange(e); if (e.target.files) processFiles(e.target.files); }}
              style={{ display: 'none' }}
            />
          </Hoverable>
        ))}
      </div>
      {busy && (
        <div style={sx('font-size:12.5px;color:var(--color-accent);margin:-14px 0 20px')}>Processing "{busy}"…</div>
      )}

      {preview && (
        <div className="card elev-md" style={sx('padding:20px 22px;margin-bottom:22px;gap:12px;border:1px solid var(--color-accent)')}>
          <h4 style={sx('margin:0;font-size:17px;font-weight:600')}>Review before merging "{preview.row.filename}"</h4>
          {preview.diff.toInsert.length > 0 && (
            <div>
              <div style={sx('font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--pw-pos);margin-bottom:4px')}>New — {preview.diff.toInsert.length}</div>
              {preview.diff.toInsert.map((h, i) => (<div key={i} style={sx('font-size:13px;padding:3px 0')}>{h.name} <span style={sx('opacity:.5')}>({h.assetClass})</span></div>))}
            </div>
          )}
          {preview.diff.toUpdate.length > 0 && (
            <div>
              <div style={sx('font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-accent);margin-bottom:4px')}>Updated — {preview.diff.toUpdate.length}</div>
              {preview.diff.toUpdate.map((u, i) => (
                <div key={i} style={sx('font-size:13px;padding:3px 0;display:flex;justify-content:space-between;gap:10px')}>
                  <span>{u.incoming.name}</span>
                  <span style={sx('font-variant-numeric:tabular-nums;opacity:.7')}>OMR {Math.round(u.existing.current_value_omr).toLocaleString()} → {Math.round(u.incoming.currentValueOMR ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {preview.diff.toDelete.length > 0 && (
            <div>
              <div style={sx('font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--pw-neg);margin-bottom:4px')}>Not in this file — treated as sold, will be removed ({preview.diff.toDelete.length})</div>
              {preview.diff.toDelete.map((h, i) => (<div key={i} style={sx('font-size:13px;padding:3px 0')}>{h.name} <span style={sx('opacity:.5')}>({h.asset_class})</span></div>))}
            </div>
          )}
          {!preview.diff.toInsert.length && !preview.diff.toUpdate.length && !preview.diff.toDelete.length && (
            <div style={sx('font-size:13px;opacity:.6')}>No changes detected.</div>
          )}
          <div style={sx('display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--color-divider);padding-top:12px')}>
            <button className="btn btn-primary" onClick={() => { commitMerge(preview.row, preview.diff); setPreview(null); }}>Confirm merge</button>
            <button className="btn btn-secondary" onClick={() => setPreview(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px')}>
        <div className="card" style={sx('padding:20px 22px;gap:8px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Ingestion pipeline</h4>
          {up.steps.map((s: any, i: number) => (
            <div key={i} style={sx('display:flex;gap:11px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--color-divider)')}>
              <span style={sx('font-size:11px;color:var(--color-accent);width:14px;font-variant-numeric:tabular-nums')}>{s.n}</span>
              <div style={sx('flex:1')}><div style={sx('font-size:13px')}>{s.label}</div><div style={sx('font-size:10.5px;opacity:.5')}>{s.note}</div></div>
              <span style={sx('font-size:11px;opacity:.55')}>{s.state}</span>
            </div>
          ))}
        </div>
        <div className="card" style={sx('padding:20px 22px;gap:8px')}>
          <h4 style={sx('margin:0;font-size:18px;font-weight:600')}>Uploaded files</h4>
          {!pending.length && (
            <div style={sx('font-size:12.5px;opacity:.6')}>No files uploaded yet in this account.</div>
          )}
          {pending.map((row) => (
            <div key={row.id} style={sx('padding:10px 0;border-bottom:1px solid var(--color-divider);display:flex;flex-direction:column;gap:6px')}>
              <div style={sx('display:flex;justify-content:space-between;gap:10px;align-items:baseline')}>
                <span style={sx('font-size:13.5px')}>{row.filename}</span>
                <span style={sx('font-size:11px;color:var(--color-accent)')}>{row.parsed_json.holdings.length} holding(s) found</span>
              </div>
              {row.parsed_json.needsReview.map((n, i) => (
                <div key={i} style={sx('font-size:11.5px;opacity:.6')}>⚠ {n.field}: {n.why}</div>
              ))}
              {row.parsed_json.holdings.length > 0 && (
                <button className="btn btn-primary btn-block" disabled={previewing === row.id} onClick={() => startPreview(row)}>
                  {previewing === row.id ? 'Comparing to your current portfolio…' : `Review ${row.parsed_json.holdings.length} holding(s) to merge`}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
