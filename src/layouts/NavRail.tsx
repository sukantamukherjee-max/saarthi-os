import { sx } from '../components/sx';
import Hoverable from '../components/Hoverable';

const RAIL_BTN = 'display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 13px;border:0;border-radius:22px;background:transparent;cursor:pointer;color:var(--color-text);font-family:var(--font-body);font-size:11px';
const RAIL_HOVER = 'background:color-mix(in srgb,var(--color-accent) 18%,transparent)';
const DOT = <span style={sx('width:4px;height:4px;border-radius:50%;background:var(--color-accent)')}></span>;

export default function NavRail({ vm }: { vm: any }) {
  return (
    <div style={sx('position:fixed;left:0;right:0;bottom:20px;z-index:60;display:flex;justify-content:center;pointer-events:none;padding:0 16px')}>
      <div style={sx('display:flex;flex-direction:column;align-items:center;gap:12px;pointer-events:auto;max-width:100%')}>
        {vm.navOpen && (
          <div style={sx('display:flex;flex-wrap:wrap;justify-content:center;gap:2px;background:var(--color-surface);border:2px solid var(--color-text);border-radius:30px;padding:6px;box-shadow:var(--shadow-lg);animation:pwRail .28s cubic-bezier(.2,.85,.3,1) both;max-width:min(94vw,880px)')}>
            <Hoverable onClick={vm.h.go.overview} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="m15.5 8.5-2 5-5 2 2-5z"></path></svg>Overview
              {vm.act.overview && DOT}
            </Hoverable>
            <Hoverable onClick={vm.h.go.portfolio} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15.9A9 9 0 1 1 8.1 2.8"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>Portfolio
              {vm.act.portfolio && DOT}
            </Hoverable>
            <Hoverable onClick={vm.h.go.retirement} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12M6 22h12M17 22v-4.2L12 13l-5 4.8V22M7 2v4.2l5 4.8 5-4.8V2"></path></svg>Retirement
              {vm.act.retirement && DOT}
            </Hoverable>
            <Hoverable onClick={vm.h.go.education} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"></path><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"></path></svg>Education
              {vm.act.education && DOT}
            </Hoverable>
            <Hoverable onClick={vm.h.go.marriage} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 3.5C19 16.5 12 21 12 21z"></path></svg>Marriage
              {vm.act.marriage && DOT}
            </Hoverable>
            <Hoverable onClick={vm.h.go.risk} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8.5v4M12 16h.01"></path></svg>Risk
              {vm.act.risk && DOT}
            </Hoverable>
            <Hoverable onClick={vm.h.go.recommendations} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 6h11M10 12h11M10 18h11"></path><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"></path></svg>Advice
              {vm.act.recommendations && DOT}
            </Hoverable>
            <Hoverable onClick={vm.h.go.assumptions} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"></path><circle cx="9" cy="6" r="2"></circle><circle cx="15" cy="12" r="2"></circle><circle cx="8" cy="18" r="2"></circle></svg>Assumptions
              {vm.act.assumptions && DOT}
            </Hoverable>
            <Hoverable onClick={vm.h.go.upload} style={RAIL_BTN} hoverStyle={RAIL_HOVER}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M8 8l4-4 4 4"></path><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg>Upload
              {vm.act.upload && DOT}
            </Hoverable>
          </div>
        )}
        <div style={sx('display:flex;align-items:center;gap:10px')}>
          <Hoverable
            onClick={vm.h.toggleNav}
            aria-label="Open navigation"
            style="display:flex;align-items:center;gap:9px;height:48px;padding:0 22px;border:2px solid var(--color-text);border-radius:999px;background:var(--color-accent);color:#fff;cursor:pointer;font-family:var(--font-heading);font-weight:600;font-size:13px;letter-spacing:.02em;text-transform:uppercase;box-shadow:var(--shadow-md)"
            hoverStyle="background:var(--color-accent-700)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>{vm.navLabel}
          </Hoverable>
          <Hoverable
            onClick={vm.h.toggleWhatIf}
            style="display:flex;align-items:center;gap:8px;height:48px;padding:0 20px;border:2px solid var(--color-text);border-radius:999px;background:var(--pw-o);color:#fff;box-shadow:var(--shadow-md);cursor:pointer;font-family:var(--font-heading);font-weight:600;font-size:13px;letter-spacing:.02em;text-transform:uppercase"
            hoverStyle="background:var(--pw-o-bright)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"></path><circle cx="12" cy="12" r="3.2"></circle></svg>What if?
          </Hoverable>
        </div>
      </div>
    </div>
  );
}
