// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [serverBody, setServerBody] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setServerBody(null);
    setLoading(true);
    const result = await signup({ name, email, password });
    setLoading(false);
    if (!result.ok) {
      setErr(result.error || 'Signup failed');
      return;
    }
    setServerBody(result.body || null);
    // if signup succeeded, try to redirect based on owner flag
    try {
      const res = await fetch('/auth/me', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        const user = d.user || d;
        const isOwner = user?.isOwner || (user?.role === 'owner') || (user?.type === 'owner') || (user?.roles?.includes?.('owner'));
        if (isOwner) { navigate('/owner/dashboard'); return; }
      }
    } catch (e) {}
    navigate('/');
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h3 style={{ fontWeight: 700 }}>Create an owner account</h3>
      <p className="subtle" style={{ marginTop: 6 }}>Register to manage your business listing.</p>

      <form onSubmit={submit} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} className="chat-input" />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="chat-input" />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="chat-input" />
        {err && <div style={{ color: 'crimson' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
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
