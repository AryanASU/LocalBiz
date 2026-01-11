import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OwnerLogin({ onLogin }) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState('');
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault(); setMsg('Logging in...');
    try {
      const res = await fetch('/auth/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin && onLogin(data);
      nav('/owner/dashboard');
    } catch (err) { setMsg('Error: ' + err.message); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="text-lg font-medium">Owner Login</h2>
      <input className="p-2 border rounded w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="p-2 border rounded w-full" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <div><button className="px-4 py-2 bg-sky-600 text-white rounded">Login</button> <span className="ml-3">{msg}</span></div>
    </form>
  );
}
