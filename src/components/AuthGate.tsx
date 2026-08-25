import type { ReactNode } from 'react';
import { sx } from './sx';
import { useAuth } from '../hooks/useAuth';
import { supabaseConfigured } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/demoMode';
import LoginPage from '../pages/LoginPage';

/**
 * Gates the app behind Supabase auth. If Supabase env vars aren't configured
 * yet, falls through to demo mode (no login) instead of blocking the app —
 * matches the "never show a blank screen" rule while backend setup is in progress.
 * A `?demo` URL param forces the same no-login, illustrative-data path even
 * when Supabase IS configured and the visitor's browser has a real session —
 * so the link is safe to hand to anyone without ever touching real data.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (isDemoMode() || !supabaseConfigured) return <>{children}</>;

  if (loading) {
    return (
      <div style={sx('min-height:100vh;display:grid;place-items:center;background:var(--color-bg);color:var(--color-text);font-family:var(--font-body);font-size:13px;opacity:.6')}>
        Loading…
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return <>{children}</>;
}
