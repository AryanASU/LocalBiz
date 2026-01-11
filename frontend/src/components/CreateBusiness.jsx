import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateBusiness({ owner }) {
  const [form, setForm] = useState({ name:'', category:'', city:'', lon:'', lat:'', description:'' });
  const [msg, setMsg] = useState('');
  const nav = useNavigate();

  useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      const res = await fetch('/auth/me');
      if (!mounted) return;
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      // you probably don't want to overwrite owner prop here; if you do, use setOwner from context
      // otherwise just ignore since App already fetched owner
    } catch (err) {
      // ignore
    }
  })();
  return () => { mounted = false; };
}, []);

  async function submit(e) {
    e.preventDefault();
    if (!owner) {
      // redirect to login if not logged in
      nav('/owner/login');
      return;
    }

    setMsg('Saving...');
    const lon = parseFloat(form.lon);
    const lat = parseFloat(form.lat);
    if (!isFinite(lon) || !isFinite(lat)) {
      setMsg('Error: Longitude and latitude must be numbers');
      return;
    }
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      setMsg('Error: lon must be between -180 and 180, lat between -90 and 90');
      return;
    }

    const body = {
      name: form.name,
      category: form.category,
      description: form.description,
      address: { city: form.city },
      location: { type: 'Point', coordinates: [lon, lat] }
    };

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg('Saved!');
      setForm({ name:'', category:'', city:'', lon:'', lat:'', description:'' });
    } catch (err) {
      setMsg('Error: ' + err.message);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="col-span-2">
        <h2 className="text-lg font-medium mb-2">Create Business {owner ? '' : '(Owner login required)'}</h2>
      </div>

      <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="p-2 border rounded-md" />
      <input placeholder="Category" value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="p-2 border rounded-md" />
      <input placeholder="City" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} className="p-2 border rounded-md" />
      <input placeholder="Longitude (e.g. -112.0740)" value={form.lon} onChange={e=>setForm({...form, lon: e.target.value})} className="p-2 border rounded-md" />
      <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="p-2 border rounded-md col-span-2" />
      <input placeholder="Latitude (e.g. 33.4484)" value={form.lat} onChange={e=>setForm({...form, lat: e.target.value})} className="p-2 border rounded-md" />

      <div className="col-span-2 flex items-center gap-4">
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-md">Create</button>
        <span className="text-sm text-slate-500">{msg}</span>
      </div>
    </form>
  );
}
