import { sx } from '../components/sx';
import Hoverable from '../components/Hoverable';

const RAIL_BTN = 'display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 20px;border:0;border-radius:16px;background:transparent;cursor:pointer;color:var(--color-text);font-family:var(--font-body);font-size:11px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.35)) drop-shadow(0 1px 12px rgba(0,0,0,.18))';
const RAIL_HOVER = 'background:color-mix(in srgb,var(--color-accent) 20%,transparent)';
const DOT = <span style={sx('width:4px;height:4px;border-radius:50%;background:var(--color-accent)')}></span>;

/** The 9-destination dropdown, positioned by the caller (opens under the header's nav button). Deliberately chromeless — no card, no border — so the icons read as floating over the page rather than a boxed panel. */
export default function NavMenu({ vm }: { vm: any }) {
  if (!vm.navOpen) return null;
  return (
    <div style={sx('display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0;animation:pwFade .2s ease both;color:var(--color-text)')}>
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
  );
}
