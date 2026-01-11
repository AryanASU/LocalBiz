import React, { useState } from 'react';
import BusinessCard from './BusinessCard';

// NearbyFinder: gets geolocation and fetches /api/businesses/nearby
export default function NearbyFinder() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [radius, setRadius] = useState(50000);
  const [category, setCategory] = useState('All');

  const findNearby = () => {
    setErr('');
    setPlaces([]);
    if (!navigator.geolocation) {
      setErr('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const categoryQuery = category === 'All' ? '' : `&category=${encodeURIComponent(category)}`;
        const res = await fetch(`/api/businesses/nearby?lat=${lat}&lon=${lon}&limit=50&radius=${radius}${categoryQuery}`);
        if (!res.ok) {
          const errBody = await res.json().catch(()=>({error:'unknown'}));
          throw new Error(errBody.message || errBody.error || 'server error');
        }
        const data = await res.json();
        setPlaces(data);
      } catch (e) {
        setErr('Fetch error: ' + (e.message || e));
      } finally {
        setLoading(false);
      }
    }, () => {
      setErr('Location denied or unavailable');
      setLoading(false);
    }, { timeout: 10000 });
  };

  return (
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <select value={category} onChange={e=>setCategory(e.target.value)} style={{ padding:8, borderRadius:8 }}>
          <option>All</option>
          <option>Land Mowing</option>
          <option>Plumbing</option>
          <option>Roofing</option>
          <option>Electrical</option>
        </select>

        <select value={radius} onChange={e=>setRadius(Number(e.target.value))} style={{ padding:8, borderRadius:8 }}>
          <option value={5000}>5 km</option>
          <option value={10000}>10 km</option>
          <option value={25000}>25 km</option>
          <option value={50000}>50 km</option>
        </select>

        <button onClick={findNearby} className="btn btn-primary">Find Nearby</button>
      </div>

      {loading && <div className="subtle">Loading…</div>}
      {err && <div style={{ color: 'crimson' }}>{err}</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {places.length === 0 && !loading && <div className="subtle">No businesses found — try increasing radius.</div>}
        {places.map(p => (
          <BusinessCard key={p._id} b={p} />
        ))}
      </div>
    </div>
  );
}
