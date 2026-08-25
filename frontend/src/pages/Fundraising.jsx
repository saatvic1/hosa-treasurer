import React, { useState } from 'react';
import axios from 'axios';

import api from '../api';

export default function Fundraising({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', goal: 0, raised: 0, date: '', description: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);

  const fundraisers = data.fundraisers || [];

  const handleSave = async () => {
    if (!form.name) return alert('Fundraiser name required');
    try {
      if (editingId) {
        await api.patch(`/fundraisers/${editingId}`, form);
      } else {
        await api.post('/fundraisers', form);
      }
      reload();
      setShowModal(false);
      setForm({ name: '', goal: 0, raised: 0, date: '', description: '', status: 'active' });
      setEditingId(null);
    } catch (err) {
      alert('Error saving fundraiser');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete fundraiser?')) return;
    try {
      await api.delete(`/fundraisers/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const totalRaised = fundraisers.reduce((s, f) => s + (f.raised || 0), 0);
  const totalGoal = fundraisers.reduce((s, f) => s + (f.goal || 0), 0);

  return (
    <div>
      <h2 className="card-title-main">Fundraising</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Raised</div>
          <div className="metric-value" style={{ color: '#2d5a3d' }}>${totalRaised.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Goal</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>${totalGoal.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Progress</div>
          <div className="metric-value">{totalGoal > 0 ? ((totalRaised / totalGoal) * 100).toFixed(0) : 0}%</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', goal: 0, raised: 0, date: '', description: '', status: 'active' }); setEditingId(null); }} style={{ marginBottom: '20px' }}>
        ➕ Create Fundraiser
      </button>

      <div className="card">
        <div className="card-title">All Fundraisers ({fundraisers.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Goal</th>
                <th>Raised</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fundraisers.length > 0 ? (
                fundraisers.map(f => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>${(f.goal || 0).toFixed(2)}</td>
                    <td>${(f.raised || 0).toFixed(2)}</td>
                    <td>{f.goal > 0 ? ((f.raised / f.goal) * 100).toFixed(0) : 0}%</td>
                    <td><span className={`badge badge-${f.status === 'active' ? 'blue' : f.status === 'completed' ? 'green' : 'gray'}`}>{f.status}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(f); setEditingId(f.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(f.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8b8580' }}>No fundraisers</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Fundraiser' : 'Create Fundraiser'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Fundraiser Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Goal</label>
                  <input className="form-input" type="number" step="0.01" value={form.goal} onChange={(e) => setForm({ ...form, goal: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Raised So Far</label>
                  <input className="form-input" type="number" step="0.01" value={form.raised} onChange={(e) => setForm({ ...form, raised: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
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
