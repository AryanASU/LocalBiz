// src/pages/OwnerDashboard.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import BusinessForm from '../components/BusinessForm';
import BusinessCard from '../components/BusinessCard';
import { io } from 'socket.io-client';
import { createPortal } from 'react-dom';

/**
 * OwnerDashboard.jsx
 *
 * - Shows owner's businesses
 * - When a business is selected, loads conversations for that business
 * - Groups conversations by visitor name / id
 * - Allows sorting and searching of grouped threads
 * - Open an owner chat modal per visitor (owner can reply)
 */

function OwnerChatModal({ businessId, visitorId, visitorName, owner, onClose }) {
  const [history, setHistory] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const sendLock = useRef(false);

  // helper to append and dedupe
  function append(msg) {
    setHistory(prev => {
      if (!msg) return prev;
      if (msg._id && prev.some(m => String(m._id) === String(msg._id))) return prev;
      return prev.concat(msg);
    });
  }

  useEffect(() => {
    // create socket when modal mounts
    if (!businessId || !visitorId) return;
    if (socketRef.current) return;
    const s = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = s;
    try { window.__ownerSocket = s; } catch (e) {}

    s.on('connect', () => {
      setConnected(true);
      // join as owner to the business room
      s.emit('join', { businessId, name: owner?.name || owner?.email || 'Owner' });
    });

    s.on('disconnect', () => {
      setConnected(false);
      setJoined(false);
    });

    s.on('history', (msgs) => {
      // server should return history filtered by business (and possibly visitor)
      setHistory(msgs || []);
      setJoined(true);
    });

    s.on('message', (m) => {
      // only append messages relevant to this visitor thread
      // we expect message to carry visitorId (visitor who sent the message)
      if (!m) return;
      if (visitorId && m.visitorId && String(m.visitorId) !== String(visitorId)) return;
      append(m);
    });

    s.on('connect_error', (err) => {
      console.error('owner chat connect_error', err && err.message);
    });

    return () => {
      try { s.off(); s.disconnect(); } catch (e) {}
      socketRef.current = null;
      try { delete window.__ownerSocket; } catch {}
    };
  }, [businessId, visitorId, owner]);

  useEffect(() => {
    // scroll to bottom when history changes
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight + 200;
  }, [history.length]);

  const send = async () => {
    if (!socketRef.current || !joined) return;
    if (!text.trim()) return;
    if (sendLock.current) return;
    sendLock.current = true;
    setTimeout(() => sendLock.current = false, 600);

    const payload = {
      businessId,
      text: text.trim(),
      from: owner?.name || owner?.email || 'Owner',
      ownerId: owner?._id,
      visitorId, // target visitor of this thread
    };

    // optimistic
    append({ ...payload, _id: 'local-' + Date.now(), createdAt: new Date().toISOString() });

    try {
      socketRef.current.emit('message', payload);
    } catch (err) {
      console.error('emit error', err && (err.message || err));
    } finally {
      setText('');
    }
  };

  if (!businessId || !visitorId) return null;

  const modal = (
    <div className="chat-modal-backdrop" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div>
            <div className="chat-title">Chat — {visitorName || visitorId}</div>
            <div className="subtle">Business: {businessId} • status: {connected ? 'connected' : 'disconnected'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div ref={listRef} className="chat-history">
          {history.map((m, i) => (
            <div key={m._id || i} style={{ display: 'flex', justifyContent: (m.ownerId || m.from === owner?.name) ? 'flex-end' : 'flex-start' }}>
              <div className={`msg-bubble ${(m.ownerId || m.from === owner?.name) ? 'msg-me' : 'msg-other'}`}>
                {m.from !== 'system' && <div className="msg-meta">{m.from} • {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}</div>}
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-row">
          <input className="chat-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} />
          <button className="chat-send" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function OwnerDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [conversations, setConversations] = useState([]); // flat array of message objects or convo objects
  const [filter, setFilter] = useState({ sort: 'new', search: '' });
  const [loading, setLoading] = useState(false);

  // chat modal state
  const [openChat, setOpenChat] = useState({ open: false, visitorId: null, visitorName: null });

  useEffect(() => {
    // load businesses owned by the user
    async function loadBusinesses() {
      try {
        setLoading(true);
        const opts = { credentials: 'include', headers: {} };
        if (token) opts.headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/owner/businesses', opts);
        if (!res.ok) {
          setBusinesses([]);
          return;
        }
        const data = await res.json();
        setBusinesses(data || []);
        if (data && data.length > 0) {
          setSelectedBusiness(prev => prev ? data.find(b => String(b._id) === String(prev._id)) || data[0] : data[0]);
        }
      } catch (e) {
        console.error('load owner businesses', e);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    }
    loadBusinesses();
  }, [token]);

  useEffect(() => {
    // load conversations for selected business
    if (!selectedBusiness) {
      setConversations([]);
      return;
    }
    async function loadConversations() {
      try {
        setLoading(true);
        const opts = { credentials: 'include', headers: {} };
        if (token) opts.headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`/api/businesses/${selectedBusiness._id}/conversations`, opts);
        if (!res.ok) {
          setConversations([]);
          return;
        }
        const data = await res.json();
        // Accept either grouped server format or flat message list
        // If server returns grouped, adapt; otherwise we keep flat
        setConversations(data || []);
      } catch (e) {
        console.error('load conversations error', e);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, [selectedBusiness, token]);

  // grouping logic: produce groups keyed by visitorId / name
  const grouped = useMemo(() => {
    // if conversations is already grouped (array of groups with { visitorId, visitorName, messages }), return adapted
    if (!conversations || conversations.length === 0) return [];

    // detect if server returned grouped format
    const maybeGroup = conversations.every(c => c?.visitorId || c?.name || c?.msgs || c?.messages);
    if (maybeGroup && conversations[0]?.msgs) {
      // server returned groups: convert to unified shape [{ name, msgs }]
      return conversations.map(g => ({ name: g.visitorName || g.name || g.visitorId || 'Unknown', msgs: g.msgs || g.messages || [] }));
    }

    // else, treat conversations as flat messages: group by visitorId or from field
    const map = new Map();
    for (const m of conversations) {
      const who = m.visitorId || m.from || m.visitorName || 'Unknown';
      const key = String(who);
      if (!map.has(key)) map.set(key, { name: (m.visitorName || m.from || 'Unknown'), msgs: [] });
      map.get(key).msgs.push(m);
    }
    let arr = Array.from(map.values());
    // sort messages inside groups by createdAt asc
    arr.forEach(g => g.msgs.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)));

    // group-level sorting
    if (filter.sort === 'atoz') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (filter.sort === 'ztoa') arr.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    else if (filter.sort === 'new') arr.sort((a, b) => (new Date(b.msgs[b.msgs.length - 1]?.createdAt || 0)) - (new Date(a.msgs[a.msgs.length - 1]?.createdAt || 0)));
    else if (filter.sort === 'old') arr.sort((a, b) => (new Date(a.msgs[0]?.createdAt || 0)) - (new Date(b.msgs[0]?.createdAt || 0)));

    if (filter.search) arr = arr.filter(g => (g.name || '').toLowerCase().includes(filter.search.toLowerCase()));

    return arr;
  }, [conversations, filter]);

  const openVisitorChat = (visitorId, visitorName) => {
    setOpenChat({ open: true, visitorId, visitorName });
  };

  const closeVisitorChat = () => {
    setOpenChat({ open: false, visitorId: null, visitorName: null });
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontWeight: 800 }}>Owner Dashboard</h2>
            <div className="subtle">Manage your businesses and visitor conversations</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate('/owner/business/new')}>Create business</button>
            <button className="btn btn-ghost" onClick={() => { /* optionally open profile */ }}>Profile</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 12, marginTop: 12 }}>
        <aside>
          <div className="card">
            <h4 style={{ fontWeight: 700 }}>Your businesses</h4>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading && <div className="subtle">Loading…</div>}
              {businesses.map(b => (
                <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelectedBusiness(b)}>
                    <div style={{ fontWeight: 700 }}>{b.name}</div>
                    <div className="subtle">{b.category} • {b.address?.city}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => setSelectedBusiness(b)}>View</button>
                    <button className="btn btn-ghost" onClick={() => navigate(`/owner/business/${b._id}/edit`)}>Edit</button>
                  </div>
                </div>
              ))}
              {businesses.length === 0 && <div className="subtle">No businesses yet.</div>}
            </div>
          </div>
        </aside>

        <section>
          {!selectedBusiness && (
            <div className="card">
              <div className="subtle">Select a business to view conversations and manage it.</div>
            </div>
          )}

          {selectedBusiness && (
            <>
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{selectedBusiness.name}</div>
                    <div className="subtle">{selectedBusiness.address?.full || selectedBusiness.address?.city}</div>
                  </div>
                  <div>
                    <button className="btn btn-primary" onClick={() => navigate(`/owner/business/${selectedBusiness._id}/edit`)}>Edit business</button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Conversations</strong>
                    <div className="subtle">Each visitor is a separate thread</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input placeholder="Search by visitor name" value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} className="chat-input" style={{ width: 220 }} />
                    <select value={filter.sort} onChange={e => setFilter({ ...filter, sort: e.target.value })} className="chat-input" style={{ width: 160 }}>
                      <option value="new">Newest</option>
                      <option value="old">Oldest</option>
                      <option value="atoz">A → Z</option>
                      <option value="ztoa">Z → A</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  {grouped.length === 0 && <div className="subtle">No conversations yet.</div>}

                  {grouped.map(g => (
                    <div key={g.name} className="card" style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{g.name}</div>
                          <div className="subtle">{g.msgs.length} messages • Last: {g.msgs[g.msgs.length - 1] ? new Date(g.msgs[g.msgs.length - 1].createdAt).toLocaleString() : '—'}</div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary" onClick={() => openVisitorChat(g.msgs[g.msgs.length - 1]?.visitorId || g.msgs[0]?.visitorId || g.name, g.name)}>Open chat</button>
                          <button className="btn btn-ghost" onClick={() => { /* archive stub */ }}>Archive</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {openChat.open && selectedBusiness && (
        <OwnerChatModal
          businessId={selectedBusiness._id}
          visitorId={openChat.visitorId}
          visitorName={openChat.visitorName}
          owner={user}
          onClose={closeVisitorChat}
        />
      )}
    </div>
  );
}
