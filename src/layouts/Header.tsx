import { sx } from '../components/sx';
import Hoverable from '../components/Hoverable';
import SaarthiMark from '../components/SaarthiMark';
import { useAuth } from '../hooks/useAuth';
import { supabaseConfigured } from '../lib/supabaseClient';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', path: '<circle cx="12" cy="12" r="9"></circle><path d="m15.5 8.5-2 5-5 2 2-5z"></path>' },
  { key: 'portfolio', label: 'Portfolio', path: '<path d="M21.2 15.9A9 9 0 1 1 8.1 2.8"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path>' },
  { key: 'retirement', label: 'Retirement', path: '<path d="M6 2h12M6 22h12M17 22v-4.2L12 13l-5 4.8V22M7 2v4.2l5 4.8 5-4.8V2"></path>' },
  { key: 'timeline', label: 'Timeline', path: '<path d="M3 3v18h18"></path><path d="M7 15l4-6 3 3 5-8"></path>' },
  { key: 'education', label: 'Education', path: '<path d="M22 10 12 5 2 10l10 5 10-5z"></path><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"></path>' },
  { key: 'marriage', label: 'Marriage', path: '<path d="M12 21s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 3.5C19 16.5 12 21 12 21z"></path>' },
  { key: 'risk', label: 'Risk', path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8.5v4M12 16h.01"></path>' },
  { key: 'recommendations', label: 'Advice', path: '<path d="M10 6h11M10 12h11M10 18h11"></path><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"></path>' },
  { key: 'assumptions', label: 'Assumptions', path: '<path d="M4 6h16M4 12h16M4 18h16"></path><circle cx="9" cy="6" r="2"></circle><circle cx="15" cy="12" r="2"></circle><circle cx="8" cy="18" r="2"></circle>' },
  { key: 'upload', label: 'Upload', path: '<path d="M12 16V4M8 8l4-4 4 4"></path><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path>' },
];

export default function Header({ vm }: { vm: any }) {
  const { user, signOut } = useAuth();
  return (
    <div style={sx('position:sticky;top:0;z-index:40;background:var(--pw-head);color:var(--pw-head-ink)')}>
      <div style={sx('height:6px;background:var(--pw-o)')}></div>
      <div style={sx('max-width:1280px;margin:0 auto;padding:0 26px')}>
        <div style={sx('display:flex;align-items:flex-end;gap:22px;padding:16px 0 13px;flex-wrap:wrap')}>
          <div style={sx('display:flex;align-items:baseline;gap:14px;flex-wrap:wrap')}>
            <button
              onClick={vm.h.go.overview}
              title="Go to Overview"
              style={sx('display:flex;align-items:center;gap:10px;background:transparent;border:0;padding:0;cursor:pointer;color:inherit')}
            >
              <SaarthiMark variant="light" size={26} />
              <div style={sx('font-family:var(--font-heading);font-weight:700;font-size:21px;letter-spacing:-.025em;line-height:1;text-transform:uppercase')}>Saarthi OS</div>
            </button>
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
        <div style={sx('display:flex;align-items:center;gap:22px;padding:8px 0;overflow-x:auto;color:var(--pw-o)')}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={vm.h.go[item.key]}
              title={item.label}
              style={sx('display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:0;padding:2px 0;cursor:pointer;color:var(--pw-o);font-size:10px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;flex-shrink:0')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: item.path }}></svg>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
