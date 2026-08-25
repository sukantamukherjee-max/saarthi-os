import type { ReactNode } from 'react';
import { sx } from './sx';
import { useAuth } from '../hooks/useAuth';
import { supabaseConfigured } from '../lib/supabaseClient';
import LoginPage from '../pages/LoginPage';

/**
 * Gates the app behind Supabase auth. If Supabase env vars aren't configured
 * yet, falls through to demo mode (no login) instead of blocking the app —
 * matches the "never show a blank screen" rule while backend setup is in progress.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (!supabaseConfigured) return <>{children}</>;

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
