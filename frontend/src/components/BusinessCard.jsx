// src/components/BusinessCard.jsx
import React, { useState } from 'react';
import ChatModal from './ChatModal';
import { useNavigate } from 'react-router-dom';

export default function BusinessCard({ b }) {
  const [openChat, setOpenChat] = useState(false);
  const [likes, setLikes] = useState(Number(b.likesCount || 0));
  const navigate = useNavigate();
  const distanceKm = (b.distanceMeters && typeof b.distanceMeters === 'number') ? (b.distanceMeters / 1000).toFixed(2) : null;

  const toggleLike = async () => {
    setLikes(prev => prev + 1);
    try {
      await fetch(`/api/businesses/${b._id}/like`, { method: 'POST', credentials: 'include' });
    } catch (e) {}
  };

  return (
    <div className="card card-hover" style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
      <div style={{ width:120, height:84, borderRadius:8, overflow:'hidden', background:'#f3f4f6', flex:'0 0 120px' }}>
        <img src={b.logoUrl || b.photoUrl || '/placeholder-rect.png'} alt={b.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      </div>

      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>{b.name}</div>
            <div className="subtle" style={{ marginTop:4 }}>{b.category} {b.address?.city ? `• ${b.address.city}` : ''}</div>
          </div>
          {distanceKm && <div style={{ color:'#64748b' }}>{distanceKm} km</div>}
        </div>

        <div style={{ marginTop:8, color:'#334155' }}>{b.description}</div>

        <div style={{ marginTop:12, display:'flex', gap:8 }}>
          <button className="btn btn-primary" onClick={() => setOpenChat(true)}>Chat</button>
          <button className="btn btn-ghost" onClick={toggleLike}>Like ({likes})</button>
          <button className="btn btn-ghost" onClick={() => navigate(`/business/${b._id}`)}>View</button>
        </div>
      </div>

      {openChat && <ChatModal businessId={b._id} businessName={b.name} onClose={() => setOpenChat(false)} />}
    </div>
  );
}
