/**
 * True when the app is opened at /demo (or with `?demo` in the URL) — an
 * always-on, illustrative walkthrough (fake holdings, no login, nothing read
 * from or written to Supabase) safe to present to anyone without exposing
 * the real account's financial data. The /demo path works because the app's
 * existing SPA redirect (netlify.toml: /* -> /index.html) already serves
 * index.html for any path, so no separate deploy or routing rule is needed
 * for this to be a clean, shareable link on the same site.
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('demo')
    || window.location.pathname.replace(/\/+$/, '').toLowerCase() === '/demo';
}
