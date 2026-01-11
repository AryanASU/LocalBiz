// src/components/BusinessForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Props:
 * - business (optional) for edit
 * - onSaved callback
 */
export default function BusinessForm({ business = null, onSaved = () => {} }) {
  const [name, setName] = useState(business?.name || '');
  const [category, setCategory] = useState(business?.category || '');
  const [description, setDescription] = useState(business?.description || '');
  const [address, setAddress] = useState(business?.address?.full || '');
  const [logo, setLogo] = useState(null); // File
  const [photo, setPhoto] = useState(null); // File
  const [previewLogo, setPreviewLogo] = useState(business?.logoUrl || '');
  const [previewPhoto, setPreviewPhoto] = useState(business?.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (logo) {
      const u = URL.createObjectURL(logo);
      setPreviewLogo(u);
      return () => URL.revokeObjectURL(u);
    }
  }, [logo]);

  useEffect(() => {
    if (photo) {
      const u = URL.createObjectURL(photo);
      setPreviewPhoto(u);
      return () => URL.revokeObjectURL(u);
    }
  }, [photo]);

  async function geocodeAddress(addr) {
    // using Nominatim OpenStreetMap API (no key) - be mindful of rate limits for production
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to geocode address');
    const arr = await res.json();
    if (!arr || arr.length === 0) throw new Error('Address not found');
    const first = arr[0];
    return { lat: parseFloat(first.lat), lon: parseFloat(first.lon) };
  }

  async function handleSave(e) {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      // geocode
      const { lat, lon } = await geocodeAddress(address);

      // build form data
      const fd = new FormData();
      fd.append('name', name);
      fd.append('category', category);
      fd.append('description', description);
      fd.append('address', JSON.stringify({ full: address }));
      fd.append('location', JSON.stringify({ type: 'Point', coordinates: [lon, lat] }));

      if (logo) fd.append('logo', logo);
      if (photo) fd.append('photo', photo);

      const endpoint = business ? `/api/businesses/${business._id}` : '/api/businesses';
      const method = business ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        body: fd,
        credentials: 'include' // ensure owner cookie if used
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Save failed');
      onSaved(data);
      navigate('/owner/dashboard');
    } catch (err) {
      setErr(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
      <h3 style={{ fontWeight:700 }}>{business ? 'Edit business' : 'Create business'}</h3>
      <div style={{ marginTop:12, display:'grid', gap:10 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Business name" className="chat-input" />
        <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category (e.g. Plumbing)" className="chat-input" />
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description" className="textarea" />
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Full address (street, city, state)" className="chat-input" />
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:13, color:'#64748b', marginBottom:6 }}>Logo</div>
            <input type="file" accept="image/*" onChange={e=>setLogo(e.target.files?.[0]||null)} />
            {previewLogo && <img src={previewLogo} alt="logo" style={{ width:84, height:84, borderRadius:10, marginTop:8 }} />}
          </div>

          <div>
            <div style={{ fontSize:13, color:'#64748b', marginBottom:6 }}>Photo (optional)</div>
            <input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]||null)} />
            {previewPhoto && <img src={previewPhoto} alt="photo" style={{ width:160, height:84, objectFit:'cover', borderRadius:8, marginTop:8 }} />}
          </div>
        </div>

        {err && <div style={{ color:'crimson' }}>{err}</div>}

        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </div>
    </form>
  );
}
