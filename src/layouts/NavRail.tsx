import { sx } from '../components/sx';
import Hoverable from '../components/Hoverable';

/** Just the floating "What if?" trigger — the destination menu now lives under the header's nav button (see NavMenu). */
export default function NavRail({ vm }: { vm: any }) {
  return (
    <div style={sx('position:fixed;left:0;right:0;bottom:20px;z-index:60;display:flex;justify-content:center;pointer-events:none;padding:0 16px')}>
      <Hoverable
        onClick={vm.h.toggleWhatIf}
        style="pointer-events:auto;display:flex;align-items:center;gap:8px;height:48px;padding:0 20px;border:2px solid var(--color-text);border-radius:999px;background:var(--pw-o);color:#fff;box-shadow:var(--shadow-md);cursor:pointer;font-family:var(--font-heading);font-weight:600;font-size:13px;letter-spacing:.02em;text-transform:uppercase"
        hoverStyle="background:var(--pw-o-bright)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"></path><circle cx="12" cy="12" r="3.2"></circle></svg>What if?
      </Hoverable>
    </div>
  );
}
