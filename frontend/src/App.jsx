import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ===== LOGIN PAGE =====
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
              <p>👑 mega@admin.com<br/>megaadmin123</p>
              <p>🔧 admin@hosa.com<br/>admin123</p>
              <p>👤 member@hosa.com<br/>member123</p>
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
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      api.defaults.headers.authorization = `Bearer ${token}`;
      loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
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

      if (user?.role === 'mega-admin') {
        endpoints.push(['users', '/users']);
      }

      const responses = await Promise.all(
        endpoints.map(([key, url]) => api.get(url).catch(() => ({ data: Array.isArray({}) ? [] : {} })))
      );

      const newData = {};
      endpoints.forEach(([key], idx) => {
        newData[key] = responses[idx].data;
      });

      setData(newData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setData({});
  };

  if (!user) return <Login onLogin={(u) => { setUser(u); loadAllData(); }} />;

  const NavItem = ({ icon, label, id }) => (
    <button
      className={`nav-item ${page === id ? 'active' : ''}`}
      onClick={() => setPage(id)}
    >
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
          {loading && <div className="card">Loading...</div>}

          {/* Member Views */}
          {page === 'member-dash' && <MemberDashboard user={user} data={data} />}
          {page === 'committee-lead' && <CommitteeLead user={user} data={data} reload={loadAllData} />}

          {/* Admin Views */}
          {page === 'dashboard' && <Dashboard user={user} data={data} />}
          {page === 'members' && <Members user={user} data={data} reload={loadAllData} />}
          {page === 'committees' && <Committees user={user} data={data} reload={loadAllData} />}
          {page === 'ledger' && <Ledger user={user} data={data} reload={loadAllData} />}
          {page === 'buckets' && <Buckets user={user} data={data} reload={loadAllData} />}
          {page === 'dues' && <Dues user={user} data={data} reload={loadAllData} />}
          {page === 'fundraising' && <Fundraising user={user} data={data} reload={loadAllData} />}
          {page === 'snap' && <SNAP user={user} data={data} reload={loadAllData} />}
          {page === 'grants' && <Grants user={user} data={data} reload={loadAllData} />}
          {page === 'equipment' && <Equipment user={user} data={data} reload={loadAllData} />}
          {page === 'events' && <Events user={user} data={data} reload={loadAllData} />}
          {page === 'email' && <Email user={user} data={data} reload={loadAllData} />}
          
          {/* Mega Admin Only */}
          {page === 'users' && <Users user={user} data={data} reload={loadAllData} />}
          {page === 'slcpoints' && <SLCPoints user={user} data={data} reload={loadAllData} />}
          {page === 'settings' && <Settings user={user} data={data} reload={loadAllData} />}
        </main>
      </div>
    </div>
  );
}

// ===== MEMBER DASHBOARD - Single Page Summary =====
function MemberDashboard({ user, data }) {
  const [dashData, setDashData] = useState({});

  useEffect(() => {
    const loadDash = async () => {
      try {
        const res = await api.get('/member-dashboard');
        setDashData(res.data);
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
            <div className="summary-value">${dashData.outstandingFees?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Equipment Checked Out</div>
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
            <div><strong>Name:</strong> {dashData.member?.name}</div>
            <div><strong>Email:</strong> {dashData.member?.email}</div>
            <div><strong>Phone:</strong> {dashData.member?.phone || 'Not provided'}</div>
            <div><strong>Grade:</strong> {dashData.member?.grade || 'Not provided'}</div>
            <div><strong>Status:</strong> <span className="badge badge-green">{dashData.member?.status}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Quick Links</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" style={{ width: '100%' }}>View My Equipment</button>
            <button className="btn btn-secondary" style={{ width: '100%' }}>View My Events</button>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Update My Info</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== COMMITTEE LEAD DASHBOARD =====
function CommitteeLead({ user, data, reload }) {
  const [comData, setComData] = useState({});
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ memberId: '', date: '', points: 1 });

  useEffect(() => {
    const loadCom = async () => {
      try {
        const res = await api.get('/committee-lead-dashboard');
        setComData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadCom();
  }, []);

  const handleAddAttendance = async () => {
    if (!attendanceForm.memberId) return alert('Select a member');
    try {
      await api.post('/attendance', { ...attendanceForm, committeeId: comData.committee?.id });
      reload();
      setShowAttendanceModal(false);
      setAttendanceForm({ memberId: '', date: '', points: 1 });
    } catch (err) {
      alert('Error adding attendance');
    }
  };

  return (
    <div>
      <h2 className="card-title-main">{comData.committee?.name || 'My Committee'}</h2>

      <div className="tabs">
        <button className="tab-btn active">Dashboard</button>
        <button className="tab-btn">Attendance</button>
      </div>

      <div className="tab-panel active">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Committee Members</div>
            <div className="metric-value">{comData.memberCount || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Attendance Records</div>
            <div className="metric-value">{comData.attendanceCount || 0}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Committee Members</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Role</th>
                  <th>Attendance Count</th>
                </tr>
              </thead>
              <tbody>
                {comData.members?.map(m => (
                  <tr key={m.id}>
                    <td>{m.memberName || 'Unknown'}</td>
                    <td>{m.role || 'Member'}</td>
                    <td>{comData.attendance?.filter(a => a.memberId === m.memberId).length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="tab-panel">
        <button className="btn btn-primary" onClick={() => setShowAttendanceModal(true)} style={{ marginBottom: '20px' }}>
          ➕ Record Attendance
        </button>

        <div className="card">
          <div className="card-title">Attendance History</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {comData.attendance?.map(a => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td>{a.memberName || 'Unknown'}</td>
                    <td><span className="badge badge-gold">{a.points} pts</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAttendanceModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Record Attendance</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAddAttendance(); }}>
              <div className="form-group">
                <label className="form-label">Member *</label>
                <select className="form-input" value={attendanceForm.memberId} onChange={(e) => setAttendanceForm({ ...attendanceForm, memberId: e.target.value })} required>
                  <option value="">Select a member</option>
                  {comData.members?.map(m => (
                    <option key={m.id} value={m.memberId}>{m.memberName}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Points</label>
                  <input className="form-input" type="number" value={attendanceForm.points} onChange={(e) => setAttendanceForm({ ...attendanceForm, points: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAttendanceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== DASHBOARD =====
function Dashboard({ data }) {
  const budget = data.buckets?.reduce((s, b) => s + (b.balance || 0), 0) || 0;
  const fundraised = data.fundraisers?.reduce((s, f) => s + (f.amount || 0), 0) || 0;

  return (
    <div>
      <h2 className="card-title-main">Dashboard</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Members</div>
          <div className="metric-value">{data.members?.length || 0}</div>
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
          <div className="metric-value">{data.committees?.length || 0}</div>
        </div>
      </div>
    </div>
  );
}

// ===== MEMBERS WITH CSV IMPORT =====
function Members({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', grade: '', notes: '' });
  const [csvData, setCsvData] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleSave = async () => {
    if (!form.name || !form.email) return alert('Fill required fields');
    try {
      if (editingId) {
        await api.patch(`/members/${editingId}`, form);
      } else {
        await api.post('/members', form);
      }
      reload();
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', grade: '', notes: '' });
      setEditingId(null);
    } catch (err) {
      alert('Error saving');
    }
  };

  const handleCSVImport = async () => {
    if (!csvData.trim()) return alert('Paste data first');
    try {
      await api.post('/import-members', { csvData });
      reload();
      setShowCSVModal(false);
      setCsvData('');
    } catch (err) {
      alert('Error importing');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete member?')) return;
    try {
      await api.delete(`/members/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const handleEdit = (member) => {
    setForm(member);
    setEditingId(member.id);
    setShowModal(true);
  };

  return (
    <div>
      <h2 className="card-title-main">Members</h2>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', email: '', phone: '', grade: '', notes: '' }); setEditingId(null); }}>
          ➕ Add Member
        </button>
        <button className="btn btn-secondary" onClick={() => setShowCSVModal(true)}>
          📋 Import from Google Forms
        </button>
      </div>

      <div className="card">
        <div className="card-title">All Members ({data.members?.length || 0})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.members?.map(m => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone || '-'}</td>
                  <td>{m.grade || '-'}</td>
                  <td>
                    <button className="btn btn-secondary btn-small" onClick={() => handleEdit(m)}>Edit</button>
                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(m.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Member' : 'Add Member'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Grade</label>
                  <select className="form-input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                    <option value="">-</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCSVModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Import from Google Forms</h2>
            <p style={{ fontSize: '13px', color: '#8b8580', marginBottom: '16px' }}>Paste data in format: <code style={{ background: '#f5f3f0', padding: '2px 6px', borderRadius: '4px' }}>Name | Email | Phone | Grade | Notes</code></p>
            <textarea className="csv-textarea" value={csvData} onChange={(e) => setCsvData(e.target.value)} placeholder="Paste your data here..." />
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCSVModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleCSVImport}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder components - will add remaining pages
function Committees() { return <div className="card"><h2 className="card-title-main">Committees</h2><p>Coming...</p></div>; }
function Ledger() { return <div className="card"><h2 className="card-title-main">Ledger</h2><p>Coming...</p></div>; }
function Buckets() { return <div className="card"><h2 className="card-title-main">Buckets</h2><p>Coming...</p></div>; }
function Dues() { return <div className="card"><h2 className="card-title-main">Dues & Fees</h2><p>Coming...</p></div>; }
function Fundraising() { return <div className="card"><h2 className="card-title-main">Fundraising</h2><p>Coming...</p></div>; }
function SNAP() { return <div className="card"><h2 className="card-title-main">SNAP Raises</h2><p>Coming...</p></div>; }
function Grants() { return <div className="card"><h2 className="card-title-main">Grants</h2><p>Coming...</p></div>; }
function Equipment() { return <div className="card"><h2 className="card-title-main">Equipment</h2><p>Coming...</p></div>; }
function Events() { return <div className="card"><h2 className="card-title-main">Events</h2><p>Coming...</p></div>; }
function Email() { return <div className="card"><h2 className="card-title-main">Email</h2><p>Coming...</p></div>; }
function Users({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'member' });
  const [editingId, setEditingId] = useState(null);

  const handleSave = async () => {
    if (!form.email) return alert('Email required');
    try {
      if (editingId) {
        await api.patch(`/users/${editingId}`, form);
      } else {
        await api.post('/users', form);
      }
      reload();
      setShowModal(false);
      setForm({ email: '', password: '', name: '', role: 'member' });
      setEditingId(null);
    } catch (err) {
      alert('Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete user?')) return;
    try {
      await api.delete(`/users/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const handleEdit = (u) => {
    setForm(u);
    setEditingId(u.id);
    setShowModal(true);
  };

  return (
    <div>
      <h2 className="card-title-main">User Management</h2>
      <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ email: '', password: '', name: '', role: 'member' }); setEditingId(null); }} style={{ marginBottom: '20px' }}>
        ➕ Create User
      </button>

      <div className="card">
        <div className="card-title">All Users</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Password</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users?.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><code style={{ background: '#f5f3f0', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>{u.password}</code></td>
                  <td><span className="badge badge-blue">{u.role}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-small" onClick={() => handleEdit(u)}>Edit</button>
                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit User' : 'Create User'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="member">Member</option>
                  <option value="committee-lead">Committee Lead</option>
                  <option value="admin">Admin</option>
                  <option value="mega-admin">Mega Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function SLCPoints({ user, data, reload }) { return <div className="card"><h2 className="card-title-main">SLC Points (Mega Admin Only)</h2><p>Total Records: {data.slcPoints?.length || 0}</p></div>; }
function Settings() { return <div className="card"><h2 className="card-title-main">Settings</h2><p>Coming...</p></div>; }

export default App;
