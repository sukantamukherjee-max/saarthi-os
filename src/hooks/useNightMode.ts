import { useEffect, useState } from 'react';

/**
 * Shared night-mode state. Applies the `pw-night` class to <html> on its own
 * mount, so it works correctly whether the app is showing LoginPage (pre-auth)
 * or the main App (post-auth) — whichever is mounted reads localStorage and
 * flips the class itself, since the two are never mounted at the same time.
 */
export function useNightMode() {
  const [night, setNight] = useState(() => {
    try { return localStorage.getItem('pwos-night') === '1'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('pw-night', night);
  }, [night]);

  const toggle = () => setNight((n) => {
    const next = !n;
    try { localStorage.setItem('pwos-night', next ? '1' : '0'); } catch { /* noop */ }
    return next;
  });

  return { night, toggle };
}
