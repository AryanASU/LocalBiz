// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [serverBody, setServerBody] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);
    if (!result.ok) {
      setErr(result.error || 'Login failed');
      return;
    }
    setServerBody(result.body || null);

    // fetch /auth/me
    try {
      const res = await fetch('/auth/me', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        const user = d.user || d;
        const isOwner = user?.isOwner || (user?.role === 'owner') || (user?.type === 'owner') || (user?.roles?.includes?.('owner'));
        if (isOwner) { navigate('/owner/dashboard'); return; }
      }
    } catch (e) { console.debug('post-login /auth/me error', e); }

    navigate('/');
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h3 style={{ fontWeight: 700 }}>Owner Login</h3>
      <p className="subtle" style={{ marginTop: 6 }}>Sign in to manage your businesses.</p>

      <form onSubmit={submit} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="chat-input" />
        <input placeholder="Password" value={password} type="password" onChange={e=>setPassword(e.target.value)} className="chat-input" />
        {err && <div style={{ color: 'crimson' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </div>
      </form>

      {serverBody && (
        <pre style={{ marginTop: 12, background: '#f7fafc', padding: 12, borderRadius: 8, fontSize: 12 }}>
          {JSON.stringify(serverBody, null, 2)}
        </pre>
      )}
    </div>
  );
}
