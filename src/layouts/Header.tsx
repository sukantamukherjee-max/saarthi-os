import { sx } from '../components/sx';
import Hoverable from '../components/Hoverable';
import SaarthiMark from '../components/SaarthiMark';
import { useAuth } from '../hooks/useAuth';
import { supabaseConfigured } from '../lib/supabaseClient';

export default function Header({ vm }: { vm: any }) {
  const { user, signOut } = useAuth();
  return (
    <div style={sx('position:sticky;top:0;z-index:40;background:var(--pw-head);color:var(--pw-head-ink)')}>
      <div style={sx('height:6px;background:var(--pw-o)')}></div>
      <div style={sx('max-width:1280px;margin:0 auto;padding:0 26px')}>
        <div style={sx('display:flex;align-items:flex-end;gap:22px;padding:16px 0 13px;flex-wrap:wrap')}>
          <div style={sx('display:flex;align-items:baseline;gap:14px;flex-wrap:wrap')}>
            <div style={sx('display:flex;align-items:center;gap:10px')}>
              <SaarthiMark variant="light" size={26} />
              <div style={sx('font-family:var(--font-heading);font-weight:700;font-size:21px;letter-spacing:-.025em;line-height:1;text-transform:uppercase')}>Saarthi OS</div>
            </div>
            <div style={sx('font-size:11.5px;color:var(--pw-head-dim)')}>Navigate Wealth. Secure Your Family's Future.</div>
          </div>
          <div style={sx('margin-left:auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap')}>
            <div style={sx('text-align:right;line-height:1.25')}>
              <div style={sx('font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--pw-head-dim)')}>Valued</div>
              <div style={sx('font-size:12px;font-variant-numeric:tabular-nums')}>24 Aug 2026 · 18:40 GST</div>
            </div>
            <div style={sx('display:flex;align-items:center;gap:6px;padding:5px 11px;border:1px solid var(--pw-head-line);border-radius:999px;font-size:11px;white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--pw-head-ink)')}>OMR · INR</div>
            <Hoverable
              onClick={vm.h.toggleNight}
              title="Toggle night mode"
              style="display:flex;align-items:center;gap:7px;height:32px;padding:0 13px;border:1px solid var(--pw-head-line);border-radius:999px;background:transparent;cursor:pointer;color:var(--pw-head-ink);font-family:var(--font-body);font-size:10px;letter-spacing:.14em;text-transform:uppercase"
              hoverStyle="border-color:var(--pw-o);color:var(--pw-o)"
            >
              {vm.night && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"></path></svg>
              )}
              {vm.day && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"></path></svg>
              )}
              {vm.nightLabel}
            </Hoverable>
            <Hoverable
              onClick={vm.h.toggleViewport}
              title="Toggle desktop / mobile preview"
              style="width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--pw-head-line);border-radius:999px;background:transparent;cursor:pointer;color:var(--pw-head-ink)"
              hoverStyle="border-color:var(--pw-o);color:var(--pw-o)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="13" height="10"></rect><rect x="17" y="8" width="5" height="12"></rect></svg>
            </Hoverable>
            <Hoverable
              onClick={vm.h.go.assumptions}
              title="Assumptions and settings"
              style="width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--pw-head-line);border-radius:999px;background:transparent;cursor:pointer;color:var(--pw-head-ink)"
              hoverStyle="border-color:var(--pw-o);color:var(--pw-o)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"></path></svg>
            </Hoverable>
            {supabaseConfigured && user && (
              <Hoverable
                onClick={() => signOut()}
                title={'Sign out (' + user.email + ')'}
                style="width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--pw-head-line);border-radius:999px;background:transparent;cursor:pointer;color:var(--pw-head-ink)"
                hoverStyle="border-color:var(--pw-o);color:var(--pw-o)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path></svg>
              </Hoverable>
            )}
          </div>
        </div>
        <div style={sx('height:2px;background:var(--pw-head-line)')}></div>
        <div style={sx('display:flex;justify-content:space-between;gap:16px;padding:8px 0 9px;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--pw-head-dim);flex-wrap:wrap')}>
          <span style={sx('color:var(--pw-o)')}>{vm.navLabel}</span>
          <span>Decision support · not advice</span>
          <span style={sx('font-variant-numeric:tabular-nums')}>Fact · Assumption · Estimate · Scenario</span>
        </div>
      </div>
    </div>
  );
}
