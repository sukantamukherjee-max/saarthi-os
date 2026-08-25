import { useState } from 'react';
import { sx } from '../components/sx';
import { useAuth } from '../hooks/useAuth';
import { useNightMode } from '../hooks/useNightMode';
import SaarthiMark from '../components/SaarthiMark';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const { night } = useNightMode();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (mode === 'signup') setNotice('Account created. If email confirmation is enabled on your Supabase project, check your inbox before signing in.');
  }

  return (
    <div style={sx('min-height:100vh;display:grid;place-items:center;background:var(--color-bg);color:var(--color-text);font-family:var(--font-body);padding:24px')}>
      <div className="card elev-md" style={sx('width:min(380px,100%);padding:28px;gap:18px')}>
        <div>
          <div style={sx('display:flex;align-items:center;gap:9px')}>
            <SaarthiMark variant={night ? 'light' : 'dark'} size={24} />
            <div style={sx('font-family:var(--font-heading);font-weight:700;font-size:19px;letter-spacing:-.02em;text-transform:uppercase')}>Saarthi OS</div>
          </div>
          <div style={sx('font-size:12px;opacity:.6;margin-top:2px')}>{mode === 'signin' ? 'Clarity for today’s money. Confidence for tomorrow.' : 'Create your account'}</div>
        </div>
        <form onSubmit={submit} style={sx('display:flex;flex-direction:column;gap:12px')}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div style={sx('font-size:12.5px;color:var(--pw-neg)')}>{error}</div>}
          {notice && <div style={sx('font-size:12.5px;color:var(--pw-pos)')}>{notice}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={sx('margin-top:4px')}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button
          className="btn btn-ghost"
          style={sx('font-size:12.5px;align-self:center')}
          onClick={() => { setMode(m => (m === 'signin' ? 'signup' : 'signin')); setError(null); setNotice(null); }}
        >
          {mode === 'signin' ? "First time here? Create an account" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
