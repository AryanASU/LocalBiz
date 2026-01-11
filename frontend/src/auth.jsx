// src/auth.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

async function fetchMeFromServer(token = null) {
  try {
    const opts = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : { credentials: 'include' };
    const res = await fetch('/auth/me', opts);
    if (!res.ok) {
      // return null but include response text for debugging if available
      try { const txt = await res.text(); console.debug('/auth/me non-ok response:', txt); } catch {}
      return null;
    }
    const data = await res.json();
    const user = data?.user || data;
    if (!user) return null;
    const isOwner =
      Boolean(user.isOwner) ||
      (typeof user.role === 'string' && user.role.toLowerCase() === 'owner') ||
      (typeof user.type === 'string' && user.type.toLowerCase() === 'owner') ||
      (Array.isArray(user.roles) && user.roles.map(r=>String(r).toLowerCase()).includes('owner')) ||
      false;
    return { ...user, isOwner };
  } catch (e) {
    console.debug('fetchMeFromServer error', e && (e.message || e));
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // bootstrap: try cookie-based, then token-based
  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      setLoading(true);
      try {
        const me = await fetchMeFromServer(token);
        if (!mounted) return;
        if (me) {
          setUser(me);
        } else if (token) {
          // invalid token - clear
          localStorage.removeItem('token');
          setToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    bootstrap();
    return () => { mounted = false; };
  }, [token]);

  // small helper used by the app to call private APIs consistently
  async function apiFetch(path, opts = {}) {
    const baseOpts = {
      credentials: 'include',
      headers: {}
    };
    if (token) baseOpts.headers.Authorization = `Bearer ${token}`;
    const merged = { ...baseOpts, ...opts };
    // merge headers
    merged.headers = { ...(baseOpts.headers||{}), ...(opts.headers||{}) };
    const res = await fetch(path, merged);
    return res;
  }

  async function login({ email, password }) {
    try {
      console.debug('login: sending /auth/login', { email });
      const res = await fetch('/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      // try to parse JSON OR text for debugging
      let body;
      try { body = await res.json(); } catch (_) { body = await res.text(); }
      console.debug('/auth/login response', res.status, body);

      if (!res.ok) {
        const msg = (body && (body.error || body.message)) || (typeof body === 'string' ? body : 'Login failed');
        throw new Error(msg);
      }

      // if returned token store it
      if (body?.token) {
        localStorage.setItem('token', body.token);
        setToken(body.token);
      }

      // fetch fresh /auth/me (gives user and isOwner)
      // try a few times because sometimes cookie isn't immediately set
      let me = await fetchMeFromServer(body?.token || localStorage.getItem('token'));
      if (!me) {
        await new Promise(r => setTimeout(r, 200));
        me = await fetchMeFromServer(body?.token || localStorage.getItem('token'));
      }
      if (me) setUser(me);
      return { ok: true, body };
    } catch (err) {
      console.debug('login error', err && (err.message || err));
      return { ok: false, error: err.message || String(err) };
    }
  }

  async function signup({ name, email, password }) {
    try {
      console.debug('signup: sending /auth/signup', { email, name });
      const res = await fetch('/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      let body;
      try { body = await res.json(); } catch (_) { body = await res.text(); }
      console.debug('/auth/signup response', res.status, body);

      if (!res.ok) {
        const msg = (body && (body.error || body.message)) || (typeof body === 'string' ? body : 'Signup failed');
        throw new Error(msg);
      }

      if (body?.token) {
        localStorage.setItem('token', body.token);
        setToken(body.token);
      }

      // fetch me
      let me = await fetchMeFromServer(body?.token || localStorage.getItem('token'));
      if (!me) {
        await new Promise(r => setTimeout(r, 200));
        me = await fetchMeFromServer(body?.token || localStorage.getItem('token'));
      }
      if (me) setUser(me);
      return { ok: true, body };
    } catch (err) {
      console.debug('signup error', err && (err.message || err));
      return { ok: false, error: err.message || String(err) };
    }
  }

  async function logout() {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, signup, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
