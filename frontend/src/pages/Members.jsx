import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export default function Members({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', grade: '', notes: '' });
  const [csvData, setCsvData] = useState('');
  const [editingId, setEditingId] = useState(null);

  const members = data.members || [];

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
      alert('Members imported!');
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

  return (
    <div>
      <h2 className="card-title-main">Members</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', email: '', phone: '', grade: '', notes: '' }); setEditingId(null); }}>
          ➕ Add Member
        </button>
        <button className="btn btn-secondary" onClick={() => setShowCSVModal(true)}>
          📋 Import from Google Forms
        </button>
      </div>

      <div className="card">
        <div className="card-title">All Members ({members.length})</div>
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
              {members.length > 0 ? (
                members.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.phone || '-'}</td>
                    <td>{m.grade || '-'}</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(m); setEditingId(m.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(m.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8b8580' }}>No members yet</td></tr>
              )}
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
            <p style={{ fontSize: '13px', color: '#8b8580', marginBottom: '16px' }}>Format: <code style={{ background: '#f5f3f0', padding: '2px 6px', borderRadius: '4px' }}>Name | Email | Phone | Grade | Notes</code></p>
            <textarea className="form-input" value={csvData} onChange={(e) => setCsvData(e.target.value)} placeholder="Paste your data here..." style={{ minHeight: '100px' }} />
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
