import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home, Ticket, Wallet, Calendar, Package, Lock, Gift, Image as ImageIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Itinerary from './components/Itinerary';
import Bookings from './components/Bookings';
import Budget from './components/Budget';
import PackingList from './components/PackingList';
import Shopping from './components/Shopping';
import Memories from './components/Memories';
import AIChatbot from './components/AIChatbot';
import { useTravelStore } from './store';
import './index.css';

const VALID_PASSWORDS = ['0702', '7842', '1107', '0615'];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Bypass on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setIsAuthenticated(true);
      return;
    }
    const auth = localStorage.getItem('trip_base_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_PASSWORDS.includes(password)) {
      localStorage.setItem('trip_base_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'inline-flex', background: 'var(--accent-glow)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          <Lock size={32} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'M PLUS Rounded 1c' }}>
          TRIP BASE
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          家族専用トラベルマネージャー<br/>パスワードを入力してください
        </p>
        
        <form onSubmit={handleLogin}>
          <input
            type="password"
            className="input-field"
            style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px', borderColor: error ? 'var(--danger)' : '' }}
            placeholder="****"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>パスワードが違います</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const selectedTripId = useTravelStore((state) => state.selectedTripId);

  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="title" style={{ fontSize: '1.25rem', marginBottom: 0, letterSpacing: '1px' }}>
            TRIP BASE
          </h1>
          <p className="subtitle" style={{ fontSize: '0.75rem' }}>家族の思い出マネージャー</p>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', color: 'var(--accent-color)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>家族</span>
          </div>
        </div>
      </header>
      
      <main className="app-container">
        {children}
      </main>

      {/* AI Chatbot */}
      <AIChatbot />

      {/* Only show bottom nav if a trip is selected (so Home acts as Trip Selector) */}
      {selectedTripId && (
        <nav className="bottom-nav" style={{ padding: '0.5rem 1rem', display: 'flex', overflowX: 'auto', gap: '0.5rem' }}>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ minWidth: '48px' }}>
            <Home size={22} />
            <span style={{ fontSize: '0.65rem' }}>ホーム</span>
          </NavLink>
          <NavLink to="/itinerary" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ minWidth: '48px' }}>
            <Calendar size={22} />
            <span style={{ fontSize: '0.65rem' }}>日程</span>
          </NavLink>
          <NavLink to="/packing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ minWidth: '48px' }}>
            <Package size={22} />
            <span style={{ fontSize: '0.65rem' }}>持物</span>
          </NavLink>
          <NavLink to="/shopping" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ minWidth: '48px' }}>
            <Gift size={22} />
            <span style={{ fontSize: '0.65rem' }}>お土産</span>
          </NavLink>
          <NavLink to="/memories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ minWidth: '48px' }}>
            <ImageIcon size={22} />
            <span style={{ fontSize: '0.65rem' }}>写真</span>
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ minWidth: '48px' }}>
            <Ticket size={22} />
            <span style={{ fontSize: '0.65rem' }}>チケ</span>
          </NavLink>
          <NavLink to="/budget" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ minWidth: '48px' }}>
            <Wallet size={22} />
            <span style={{ fontSize: '0.65rem' }}>費用</span>
          </NavLink>
        </nav>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/packing" element={<PackingList />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/budget" element={<Budget />} />
          </Routes>
        </Layout>
      </AuthGuard>
    </Router>
  );
}

export default App;
