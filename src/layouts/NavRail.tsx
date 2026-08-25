import { sx } from '../components/sx';
import Hoverable from '../components/Hoverable';
import NavMenu from './NavMenu';
import { useClickOutside } from '../hooks/useClickOutside';

const PILL = 'pointer-events:auto;display:flex;align-items:center;gap:8px;height:48px;padding:0 20px;border:2px solid var(--color-text);border-radius:999px;color:#fff;box-shadow:var(--shadow-md);cursor:pointer;font-family:var(--font-heading);font-weight:600;font-size:13px;letter-spacing:.02em;text-transform:uppercase;';

/** Floating footer bar: "Menu" pill on the left (opens the 9-destination menu, spreading rightward above the button), "What if?" pill on the right — identical shape and size. */
export default function NavRail({ vm }: { vm: any }) {
  const navRef = useClickOutside<HTMLDivElement>(vm.navOpen, vm.h.closeNav);
  return (
    <div style={sx('position:fixed;left:0;right:0;bottom:20px;z-index:60;display:flex;justify-content:space-between;align-items:center;pointer-events:none;padding:0 20px')}>
      <div ref={navRef} style={sx('position:relative;pointer-events:auto')}>
        <Hoverable
          onClick={vm.h.toggleNav}
          style={PILL + 'background:var(--color-accent)'}
          hoverStyle="background:var(--color-accent-700)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>Menu
        </Hoverable>
        <div style={sx('position:absolute;bottom:calc(100% + 10px);left:0;z-index:70')}>
          <NavMenu vm={vm} />
        </div>
      </div>
      <Hoverable
        onClick={vm.h.toggleWhatIf}
        style={PILL + 'background:var(--pw-o)'}
        hoverStyle="background:var(--pw-o-bright)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"></path><circle cx="12" cy="12" r="3.2"></circle></svg>What if?
      </Hoverable>
    </div>
  );
}
