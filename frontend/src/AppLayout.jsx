import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AppLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="logo">L</div>
          <div>
            <div className="title">LocalBiz</div>
            <div className="subtitle">Find local pros near you</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 10 }}>
          <Link to="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Explore</Link>
          <Link to="/login" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Owner Login</Link>
          <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get Listed</Link>
        </nav>
      </header>

      <main className="container" style={{ paddingTop: 28, paddingBottom: 48, flex: 1 }}>
        {children}
      </main>

      <footer className="container" style={{ padding: '18px 20px', borderTop: '1px solid rgba(15,23,42,0.04)', marginTop: 'auto' }}>
        <div style={{ color: '#64748b', fontSize: 13 }}>Built with ♥ · React · Node · MongoDB · Socket.io — demo only</div>
      </footer>
    </div>
  );
}
