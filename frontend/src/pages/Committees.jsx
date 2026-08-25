import React, { useState } from 'react';
import axios from 'axios';

import api from '../api';

export default function Committees({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', chair: '', schedule: '', defaultPts: 0 });
  const [editingId, setEditingId] = useState(null);

  const committees = data.committees || [];
  const members = data.members || [];

  const handleSave = async () => {
    if (!form.name) return alert('Committee name required');
    try {
      if (editingId) {
        await api.patch(`/committees/${editingId}`, form);
      } else {
        await api.post('/committees', form);
      }
      reload();
      setShowModal(false);
      setForm({ name: '', description: '', chair: '', schedule: '', defaultPts: 0 });
      setEditingId(null);
    } catch (err) {
      alert('Error saving committee');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete committee?')) return;
    try {
      await api.delete(`/committees/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  return (
    <div>
      <h2 className="card-title-main">Committees</h2>

      <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', description: '', chair: '', schedule: '', defaultPts: 0 }); setEditingId(null); }} style={{ marginBottom: '20px' }}>
        ➕ Create Committee
      </button>

      <div className="card">
        <div className="card-title">All Committees ({committees.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Chair</th>
                <th>Schedule</th>
                <th>Default Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {committees.length > 0 ? (
                committees.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.chair || '-'}</td>
                    <td>{c.schedule || '-'}</td>
                    <td>{c.defaultPts || 0}</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(c); setEditingId(c.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8b8580' }}>No committees</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Committee' : 'Create Committee'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Committee Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Chair</label>
                <select className="form-input" value={form.chair} onChange={(e) => setForm({ ...form, chair: e.target.value })}>
                  <option value="">Select chair...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Schedule</label>
                <input className="form-input" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="e.g. Mondays 3pm" />
              </div>
              <div className="form-group">
                <label className="form-label">Default SLC Points</label>
                <input className="form-input" type="number" value={form.defaultPts} onChange={(e) => setForm({ ...form, defaultPts: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
