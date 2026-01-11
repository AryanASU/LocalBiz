// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import NearbyFinder from '../components/NearbyFinder';
import BusinessCard from '../components/BusinessCard';

export default function Home() {
  const [top, setTop] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    // fetch top-rated nearby (server should return sorted list)
    async function loadTop() {
      try {
        const res = await fetch('/api/businesses/top?limit=5');
        if (!res.ok) return;
        const data = await res.json();
        setTop(data);
      } catch (e) {
        setErr('Failed to load top-rated');
      }
    }
    loadTop();
  }, []);

  return (
    <div>
      <div className="card card-hover" style={{ marginBottom: 20 }}>
        <h2 className="heading-large">Find local services</h2>
        <p className="lead" style={{ marginTop: 8 }}>Use your location to find nearby businesses.</p>
        <div style={{ marginTop: 16 }}>
          <NearbyFinder />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontWeight: 700 }}>Top-rated near you</h3>
        <p className="subtle" style={{ marginTop: 6 }}>Highly-rated local businesses people like.</p>

        <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
          {err && <div style={{ color:'crimson' }}>{err}</div>}
          {top.map(b => <BusinessCard key={b._id} b={b} />)}
          {top.length === 0 && <div className="subtle">No top listings yet.</div>}
        </div>
      </div>
    </div>
  );
}
