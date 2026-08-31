import React, { useState } from 'react';
import api from '../api';

export default function Users({ user, data, reload }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordsModal, setShowPasswordsModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'member' });
  const [editingId, setEditingId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setAllUsers(res.data || []);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error loading users');
    }
  };

  const handleSave = async () => {
    if (!form.email || !form.name) return alert('Email and name required');
    try {
      if (editingId) {
        await api.patch(`/users/${editingId}`, form);
      } else {
        // Generate password if not provided
        const password = form.password || generateRandomPassword();
        await api.post('/users', { ...form, password });
      }
      loadUsers();
      setShowModal(false);
      setForm({ email: '', password: '', name: '', role: 'member' });
      setEditingId(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete user?')) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      alert('Error');
    }
  };

  const generateRandomPassword = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateNewPassword = () => {
    setForm({ ...form, password: generateRandomPassword() });
  };

  return (
    <div>
      <h2 className="card-title-main">User Accounts</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ email: '', password: '', name: '', role: 'member' }); setEditingId(null); }}>
          ➕ Create User
        </button>
        <button className="btn btn-secondary" onClick={() => setShowPasswordsModal(true)}>
          🔑 View All Passwords
        </button>
      </div>

      <div className="card">
        <div className="card-title">All Users ({users.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: u.role === 'mega-admin' ? '#e8d4c0' : u.role === 'admin' ? '#d4c8e0' : '#e8f4f0',
                        color: u.role === 'mega-admin' ? '#8b5a1a' : u.role === 'admin' ? '#5a3d7a' : '#2d5a3d',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {u.role === 'mega-admin' ? '👑 MEGA ADMIN' : u.role === 'admin' ? '🔧 ADMIN' : '👤 MEMBER'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(u); setEditingId(u.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#8b8580' }}>No users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit User' : '➕ Create User'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              {!editingId && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '700', color: '#2d5a3d' }}>🔑 Password *</label>
                  <div style={{ marginBottom: '10px', padding: '10px', background: '#e8f4f0', borderRadius: '6px', fontSize: '12px', color: '#2d5a3d' }}>
                    ✓ Enter your own password OR click "Generate" for a random one
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input 
                      className="form-input" 
                      type="text" 
                      value={form.password} 
                      onChange={(e) => setForm({ ...form, password: e.target.value })} 
                      placeholder="Type password here..."
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={generateNewPassword}
                    >
                      🎲 Generate
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ padding: '8px', background: '#fff', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', color: '#2d5a3d', wordBreak: 'break-all' }}>
                      {form.password}
                    </div>
                  )}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                  <option value="member">👤 Member</option>
                  <option value="admin">🔧 Admin</option>
                  <option value="mega-admin">👑 Mega Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordsModal && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 className="modal-title">🔑 User Credentials</h2>
            <p style={{ color: '#8b8580', marginBottom: '20px' }}>All user emails and passwords. Copy and share securely!</p>
            
            {allUsers.map(u => (
              <div key={u.id} style={{ marginBottom: '20px', padding: '15px', background: '#f5f3f0', borderRadius: '8px', borderLeft: '4px solid #2d5a3d' }}>
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#8b8580', marginBottom: '4px', fontWeight: '600' }}>NAME</p>
                  <p style={{ fontSize: '14px', color: '#2d5a3d', fontWeight: '600' }}>{u.name}</p>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#8b8580', marginBottom: '4px', fontWeight: '600' }}>EMAIL</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <code style={{ fontSize: '13px', color: '#2d5a3d', fontFamily: 'monospace', flex: 1, padding: '8px', background: '#fff', borderRadius: '4px' }}>{u.email}</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText(u.email)}
                      style={{ padding: '6px 12px', fontSize: '11px', background: '#2d5a3d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#8b8580', marginBottom: '4px', fontWeight: '600' }}>PASSWORD</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <code style={{ fontSize: '13px', color: '#2d5a3d', fontFamily: 'monospace', flex: 1, padding: '8px', background: '#fff', borderRadius: '4px', wordBreak: 'break-all' }}>{u.password || '(no password set)'}</code>
                    {u.password && (
                      <button 
                        onClick={() => navigator.clipboard.writeText(u.password)}
                        style={{ padding: '6px 12px', fontSize: '11px', background: '#d4a574', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '12px', color: '#8b8580', marginBottom: '4px', fontWeight: '600' }}>ROLE</p>
                  <p style={{ fontSize: '13px', color: '#2d5a3d' }}>
                    {u.role === 'mega-admin' ? '👑 MEGA ADMIN' : u.role === 'admin' ? '🔧 ADMIN' : '👤 MEMBER'}
                  </p>
                </div>
              </div>
            ))}

            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => setShowPasswordsModal(false)}
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
