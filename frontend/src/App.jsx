import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import Members from './pages/Members';
import Users from './pages/Users';
import Committees from './pages/Committees';
import Fundraising from './pages/Fundraising';
import Ledger from './pages/Ledger';
import Buckets from './pages/Buckets';
import Dues from './pages/Dues';
import SNAP from './pages/SNAP';
import Grants from './pages/Grants';
import Equipment from './pages/Equipment';
import Events from './pages/Events';
import Email from './pages/Email';
import SLCPoints from './pages/SLCPoints';
import Settings from './pages/Settings';

const api = axios.create({
  baseURL: 'https://practical-enthusiasm-production-9012.up.railway.app/api',
  timeout: 10000,
});

// ===== LOGIN PAGE =====
function Login({ onLogin }) {
  const [email, setEmail] = useState('mega@admin.com');
  const [password, setPassword] = useState('megaadmin123');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      api.defaults.headers.authorization = `Bearer ${res.data.token}`;
      onLogin(res.data.user);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/register', { email, password, name });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      api.defaults.headers.authorization = `Bearer ${res.data.token}`;
      onLogin(res.data.user);
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1e2a36 0%, #2d3a47 100%)' }}>
      <div style={{ background: 'white', padding: '48px', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', marginBottom: '8px', color: '#2d5a3d', textAlign: 'center', fontWeight: 700 }}>
          HOSA Treasurer
        </h1>
        <p style={{ textAlign: 'center', color: '#8b8580', fontSize: '13px', marginBottom: '32px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>ENTERPRISE SYSTEM</p>
        
        {error && <div style={{ background: '#f4e3e3', color: '#b84c4c', padding: '12px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{error}</div>}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#8b8580', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required={isRegister} />
            </div>
          )}
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#8b8580', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#8b8580', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '16px' }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ background: 'none', border: 'none', color: '#2d5a3d', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            {isRegister ? 'Already have an account? Sign in' : 'Need an account? Create one'}
          </button>
        </div>

        {!isRegister && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e8e3de', fontSize: '12px', color: '#8b8580' }}>
            <p style={{ marginBottom: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>DEMO ACCOUNTS</p>
            <div style={{ fontSize: '11px', lineHeight: '1.8', fontFamily: 'DM Mono, monospace' }}>
              <p>👑 mega@admin.com / megaadmin123</p>
              <p>🔧 admin@hosa.com / admin123</p>
              <p>👤 member@hosa.com / member123</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MAIN APP =====
function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState({
    members: [],
    committees: [],
    attendance: [],
    slcPoints: [],
    transactions: [],
    buckets: [],
    fees: [],
    memberFees: [],
    fundraisers: [],
    snapCampaigns: [],
    grants: [],
    equipment: [],
    equipmentLogs: [],
    events: [],
    emailHistory: [],
    settings: {},
    users: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const user = JSON.parse(userData);
      setUser(user);
      api.defaults.headers.authorization = `Bearer ${token}`;
      loadAllData(user);
    }
  }, []);

  const loadAllData = async (currentUser) => {
    setLoading(true);
    try {
      const newData = {
        members: [],
        committees: [],
        attendance: [],
        slcPoints: [],
        transactions: [],
        buckets: [],
        fees: [],
        memberFees: [],
        fundraisers: [],
        snapCampaigns: [],
        grants: [],
        equipment: [],
        equipmentLogs: [],
        events: [],
        emailHistory: [],
        settings: {},
        users: [],
      };

      const endpoints = [
        ['members', '/members'],
        ['committees', '/committees'],
        ['attendance', '/attendance'],
        ['slcPoints', '/slc-points'],
        ['transactions', '/transactions'],
        ['buckets', '/buckets'],
        ['fees', '/fee-categories'],
        ['memberFees', '/member-fees'],
        ['fundraisers', '/fundraisers'],
        ['snapCampaigns', '/snap-campaigns'],
        ['grants', '/grants'],
        ['equipment', '/equipment'],
        ['equipmentLogs', '/equipment-logs'],
        ['events', '/events'],
        ['emailHistory', '/email-history'],
        ['settings', '/settings'],
      ];

      for (const [key, url] of endpoints) {
        try {
          const res = await api.get(url);
          newData[key] = Array.isArray(res.data) ? res.data : (typeof res.data === 'object' ? res.data : {});
        } catch (err) {
          console.log(`Failed to load ${key}`);
          newData[key] = Array.isArray(data[key]) ? [] : {};
        }
      }

      if (currentUser?.role === 'mega-admin') {
        try {
          const res = await api.get('/users');
          newData.users = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          console.log('Failed to load users');
          newData.users = [];
        }
      }

      setData(newData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <Login onLogin={(u) => { setUser(u); setTimeout(() => loadAllData(u), 300); }} />;

  const NavItem = ({ icon, label, id }) => (
    <button className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
      <span className="nav-icon" style={{ fontSize: '18px' }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="org">HOSA SLC</div>
          <div className="role">Treasurer System</div>
        </div>

        {user.role === 'member' && (
          <>
            <div className="nav-section">Dashboard</div>
            <NavItem icon="📊" label="My Dashboard" id="member-dash" />
          </>
        )}

        {user.role === 'committee-lead' && (
          <>
            <div className="nav-section">Dashboard</div>
            <NavItem icon="📊" label="My Dashboard" id="member-dash" />
            <NavItem icon="📋" label="Committee" id="committee-lead" />
          </>
        )}

        {(user.role === 'admin' || user.role === 'mega-admin') && (
          <>
            <div className="nav-section">Members</div>
            <NavItem icon="👥" label="Members" id="members" />
            <NavItem icon="👥" label="Committees" id="committees" />
            
            <div className="nav-section">Finance</div>
            <NavItem icon="📊" label="Dashboard" id="dashboard" />
            <NavItem icon="📋" label="Ledger" id="ledger" />
            <NavItem icon="🪣" label="Buckets" id="buckets" />
            <NavItem icon="💳" label="Dues & Fees" id="dues" />

            <div className="nav-section">Fundraising</div>
            <NavItem icon="💰" label="Fundraising" id="fundraising" />
            <NavItem icon="📲" label="SNAP Raises" id="snap" />
            <NavItem icon="🎁" label="Grants" id="grants" />

            <div className="nav-section">Operations</div>
            <NavItem icon="📦" label="Equipment" id="equipment" />
            <NavItem icon="🎯" label="Events" id="events" />
            <NavItem icon="📧" label="Email" id="email" />
          </>
        )}

        {user.role === 'mega-admin' && (
          <>
            <div className="nav-section">Admin</div>
            <NavItem icon="🔐" label="Users" id="users" />
            <NavItem icon="⭐" label="SLC Points" id="slcpoints" />
            <NavItem icon="⚙️" label="Settings" id="settings" />
          </>
        )}
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '280px' }}>
        <header className="header">
          <div className="header-left">
            <div className="header-title">HOSA Treasurer</div>
            <span className="role-badge">
              {user.role === 'mega-admin' ? '👑 MEGA ADMIN' : user.role === 'committee-lead' ? '👥 COMMITTEE LEAD' : user.role === 'admin' ? '🔧 ADMIN' : '👤 MEMBER'}
            </span>
          </div>
          <div className="header-right">
            <span className="user-name">{user.name}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="main-content content-center">
          {loading ? (
            <div className="card">
              <h2 className="card-title-main">Loading...</h2>
              <p>Fetching data from server...</p>
            </div>
          ) : (
            <>
              {page === 'member-dash' && <MemberDashboard user={user} data={data} />}
              {page === 'committee-lead' && <CommitteeLead user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'dashboard' && <Dashboard user={user} data={data} />}
              {page === 'members' && <Members user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'committees' && <Committees user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'ledger' && <Ledger user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'buckets' && <Buckets user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'dues' && <Dues user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'fundraising' && <Fundraising user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'snap' && <SNAP user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'grants' && <Grants user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'equipment' && <Equipment user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'events' && <Events user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'email' && <Email user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'users' && <Users user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'slcpoints' && <SLCPoints user={user} data={data} reload={() => loadAllData(user)} />}
              {page === 'settings' && <Settings user={user} data={data} reload={() => loadAllData(user)} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ===== MEMBER DASHBOARD =====
function MemberDashboard({ user, data }) {
  const [dashData, setDashData] = useState({ member: {}, outstandingFees: 0, equipmentCount: 0, eventsCount: 0, fundraisersCount: 0 });

  useEffect(() => {
    const loadDash = async () => {
      try {
        const res = await api.get('/member-dashboard');
        setDashData(res.data || {});
      } catch (err) {
        console.error(err);
      }
    };
    loadDash();
  }, []);

  return (
    <div>
      <h2 className="card-title-main">My Dashboard</h2>
      <div className="dashboard-summary">
        <div className="summary-row">
          <div className="summary-item">
            <div className="summary-label">Outstanding Fees</div>
            <div className="summary-value">${(dashData.outstandingFees || 0).toFixed(2)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Equipment</div>
            <div className="summary-value">{dashData.equipmentCount || 0}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Events</div>
            <div className="summary-value">{dashData.eventsCount || 0}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Fundraisers</div>
            <div className="summary-value">{dashData.fundraisersCount || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Personal Info</div>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            <div><strong>Name:</strong> {dashData.member?.name || 'N/A'}</div>
            <div><strong>Email:</strong> {dashData.member?.email || 'N/A'}</div>
            <div><strong>Phone:</strong> {dashData.member?.phone || '-'}</div>
            <div><strong>Grade:</strong> {dashData.member?.grade || '-'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Quick Links</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" style={{ width: '100%' }}>View Equipment</button>
            <button className="btn btn-secondary" style={{ width: '100%' }}>View Events</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== COMMITTEE LEAD =====
function CommitteeLead({ user, data, reload }) {
  return (
    <div>
      <h2 className="card-title-main">Committee Management</h2>
      <div className="card">
        <p>Committee Lead Dashboard</p>
      </div>
    </div>
  );
}

// ===== DASHBOARD =====
function Dashboard({ user, data }) {
  const buckets = data.buckets || [];
  const fundraisers = data.fundraisers || [];
  const members = data.members || [];
  const committees = data.committees || [];

  const budget = Array.isArray(buckets) ? buckets.reduce((s, b) => s + (b.balance || 0), 0) : 0;
  const fundraised = Array.isArray(fundraisers) ? fundraisers.reduce((s, f) => s + (f.raised || 0), 0) : 0;

  return (
    <div>
      <h2 className="card-title-main">Dashboard</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Members</div>
          <div className="metric-value">{members.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Budget</div>
          <div className="metric-value" style={{ color: '#2d5a3d' }}>${budget.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Fundraised</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>${fundraised.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Committees</div>
          <div className="metric-value">{committees.length}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
