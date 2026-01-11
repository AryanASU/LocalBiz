// src/components/ChatModal.jsx (replace or integrate)
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../auth.jsx';
import { useNavigate } from 'react-router-dom';

export default function ChatModal({ businessId, businessName, onClose }) {
  const socketRef = useRef(null);
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [history, setHistory] = useState([]);
  const [text, setText] = useState('');
  const sendLock = useRef(false);

  function appendMessageDedup(msg) {
    setHistory(prev => {
      if (!msg) return prev;
      if (msg._id && prev.some(m => String(m._id) === String(msg._id))) return prev;
      // avoid duplicates based on text+from in 3s window
      const now = Date.now();
      const recentSame = prev.find(m => m && m.text === msg.text && m.from === msg.from && Math.abs(new Date(m.createdAt || 0).getTime() - now) < 3000);
      if (recentSame) {
        if (msg._id) return prev.map(m => (m === recentSame ? msg : m));
        return prev;
      }
      return prev.concat(msg);
    });
  }

  useEffect(() => {
    if (!user) return; // do not create socket until user logs in
    if (socketRef.current) return;
    const s = io('/', { transports: ['websocket','polling'] });
    socketRef.current = s;
    try { window.__socket = s; } catch(e){}

    s.on('connect', () => {
      setConnected(true);
      if (businessId && user) {
        s.emit('join', { businessId, visitorId: user._id, visitorName: user.name });
      }
    });

    s.on('disconnect', () => { setConnected(false); setJoined(false); });
    s.on('history', (msgs) => { setHistory(msgs || []); setJoined(true); });
    s.on('message', (m) => { appendMessageDedup(m); });
    s.on('presence', (p) => appendMessageDedup({ _id: 'sys-'+Date.now(), from: 'system', text: p.msg, createdAt: new Date().toISOString() }));

    return () => {
      try { s.off(); s.disconnect(); } catch(e) {}
      socketRef.current = null;
      try { delete window.__socket; } catch(e){}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, businessId]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s || !user || !businessId) return;
    if (!s.connected) return;
    s.emit('join', { businessId, visitorId: user._id, visitorName: user.name });
  }, [user, businessId]);

  const send = () => {
    const s = socketRef.current;
    if (!s || !joined) return;
    if (!text.trim()) return;
    if (sendLock.current) return;
    sendLock.current = true;
    setTimeout(() => sendLock.current = false, 500);

    const payload = {
      businessId,
      text: text.trim(),
      from: user?.name || 'Visitor',
      visitorId: user?._id
    };

    // optimistic
    appendMessageDedup({ ...payload, createdAt: new Date().toISOString(), _id: 'local-' + Date.now() });

    try {
      s.emit('message', payload);
    } catch (e) {
      console.error('emit error', e);
    } finally {
      setText('');
    }
  };

  // If user not logged in, prompt
  if (!user) {
    return createPortal(
      <div className="chat-modal-backdrop" onClick={onClose}>
        <div className="chat-modal" onClick={e=>e.stopPropagation()}>
          <div className="chat-header">
            <div>
              <div className="chat-title">{businessName || 'Chat'}</div>
              <div className="subtle">Please sign in to chat with this business</div>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <p className="subtle">We require customers to sign in so owners can manage conversations per visitor.</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => { onClose(); navigate('/login'); }}>Sign in</button>
              <button className="btn btn-ghost" onClick={() => { onClose(); navigate('/signup'); }}>Create account</button>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const modal = (
    <div className="chat-modal-backdrop" onClick={onClose}>
      <div className="chat-modal" onClick={e=>e.stopPropagation()}>
        <div className="chat-header">
          <div>
            <div className="chat-title">{businessName || 'Chat'}</div>
            <div className="subtle">Chat as {user.name} • socket: {connected ? 'connected' : 'disconnected'}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="chat-history">
          {history.map((m,i) => (
            <div key={m._id || i} style={{ display:'flex', justifyContent: m.visitorId === user._id ? 'flex-end' : 'flex-start' }}>
              <div className={`msg-bubble ${m.visitorId === user._id ? 'msg-me' : 'msg-other'}`}>
                {m.from !== 'system' && <div className="msg-meta">{m.from} • {new Date(m.createdAt || Date.now()).toLocaleTimeString()}</div>}
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-row">
          <input value={text} onChange={e=>setText(e.target.value)} className="chat-input" onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); send(); }}} placeholder={joined ? 'Message...' : 'Connecting...'} disabled={!joined} />
          <button onClick={send} className="chat-send" disabled={!joined}>Send</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
