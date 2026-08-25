import { Fragment } from 'react';
import { sx } from '../components/sx';

export default function WhatIfDrawer({ vm }: { vm: any }) {
  if (!vm.whatIf) return null;
  return (
    <Fragment>
      <div style={sx('position:fixed;inset:0;z-index:69;background:transparent')} onClick={vm.h.closeWhatIf}></div>
      <div style={sx('position:fixed;top:0;right:0;bottom:0;width:min(400px,92vw);z-index:70;background:var(--color-bg);border-left:1px solid var(--color-divider);box-shadow:var(--shadow-lg);overflow-y:auto;animation:pwSlide .3s cubic-bezier(.2,.85,.3,1) both')}>
      <div style={sx('padding:22px 24px 120px;display:flex;flex-direction:column;gap:18px')}>
        <div style={sx('display:flex;align-items:baseline;justify-content:space-between')}>
          <h3 style={sx('margin:0;font-size:24px;font-weight:400')}>What if?</h3>
          <button onClick={vm.h.toggleWhatIf} className="btn btn-ghost" style={sx('font-size:13px')}>Close</button>
        </div>
        <div className="card" style={sx('padding:14px 16px;gap:6px;background:var(--color-surface)')}>
          <div style={sx('display:flex;justify-content:space-between;font-size:12.5px')}><span>Retirement probability</span><span style={sx('font-variant-numeric:tabular-nums;' + vm.wi.probCss)}>{vm.wi.prob}</span></div>
          <div style={sx('display:flex;justify-content:space-between;font-size:12.5px')}><span>Required corpus</span><span style={sx('font-variant-numeric:tabular-nums;' + vm.wi.reqCss)}>{vm.wi.req}</span></div>
          <div style={sx('display:flex;justify-content:space-between;font-size:12.5px')}><span>Earliest viable age</span><span style={sx('font-variant-numeric:tabular-nums;' + vm.wi.viableCss)}>{vm.wi.viable}</span></div>
          <div style={sx('font-size:10.5px;opacity:.5;margin-top:2px')}>Change against your saved baseline</div>
        </div>
        {vm.wi.sliders.map((s: any, i: number) => (
          <div key={i}>
            <div style={sx('display:flex;justify-content:space-between;align-items:baseline')}><span style={sx('font-size:12.5px')}>{s.label}</span><span style={sx('font-size:12.5px;font-variant-numeric:tabular-nums;color:var(--color-accent)')}>{s.value}</span></div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.raw} onChange={s.onChange} aria-label={s.label} />
          </div>
        ))}
        <div style={sx('display:flex;gap:8px;flex-wrap:wrap')}>
          <button className="btn btn-secondary" onClick={vm.h.resetWhatIf}>Reset to baseline</button>
          <button className="btn btn-primary" onClick={vm.h.commitWhatIf}>Save as baseline</button>
        </div>
        <p style={sx('font-size:11px;opacity:.5;margin:0')}>Scenario outputs are hypothetical. They do not change your holdings and are never presented as forecasts.</p>
      </div>
    </div>
    </Fragment>
  );
}
