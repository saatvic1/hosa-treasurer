import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export default function Users({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'member' });
  const [editingId, setEditingId] = useState(null);

  const users = data.users || [];

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

  return (
    <div>
      <h2 className="card-title-main">User Management - All Passwords Visible</h2>
      <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ email: '', password: '', name: '', role: 'member' }); setEditingId(null); }} style={{ marginBottom: '20px' }}>
        ➕ Create User
      </button>

      <div className="card">
        <div className="card-title">All Users ({users.length})</div>
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
              {users.length > 0 ? (
                users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><code style={{ background: '#f5f3f0', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>{u.password}</code></td>
                    <td><span className="badge badge-blue">{u.role}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(u); setEditingId(u.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8b8580' }}>No users</td></tr>
              )}
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
