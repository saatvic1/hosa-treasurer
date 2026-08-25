import React, { useState } from 'react';
import axios from 'axios';

import api from '../api';

export default function Grants({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', funder: '', amount: 0, date: '', status: 'pending', notes: '' });
  const [editingId, setEditingId] = useState(null);

  const grants = data.grants || [];

  const handleSave = async () => {
    if (!form.name) return alert('Grant name required');
    try {
      if (editingId) {
        await api.patch(`/grants/${editingId}`, form);
      } else {
        await api.post('/grants', form);
      }
      reload();
      setShowModal(false);
      setForm({ name: '', funder: '', amount: 0, date: '', status: 'pending', notes: '' });
      setEditingId(null);
    } catch (err) {
      alert('Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete grant?')) return;
    try {
      await api.delete(`/grants/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const totalAmount = grants.reduce((s, g) => s + (g.amount || 0), 0);
  const approved = grants.filter(g => g.status === 'approved').length;

  return (
    <div>
      <h2 className="card-title-main">Grants</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Grants</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>${totalAmount.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Approved</div>
          <div className="metric-value" style={{ color: '#2d5a3d' }}>{approved}</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', funder: '', amount: 0, date: '', status: 'pending', notes: '' }); setEditingId(null); }} style={{ marginBottom: '20px' }}>
        ➕ Add Grant
      </button>

      <div className="card">
        <div className="card-title">All Grants ({grants.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Grant Name</th>
                <th>Funder</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grants.length > 0 ? (
                grants.map(g => (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td>{g.funder || '-'}</td>
                    <td>${(g.amount || 0).toFixed(2)}</td>
                    <td>{g.date || '-'}</td>
                    <td><span className={`badge badge-${g.status === 'approved' ? 'green' : g.status === 'pending' ? 'amber' : 'red'}`}>{g.status}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(g); setEditingId(g.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(g.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8b8580' }}>No grants</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Grant' : 'Add Grant'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Grant Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Funder</label>
                  <input className="form-input" value={form.funder} onChange={(e) => setForm({ ...form, funder: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input className="form-input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
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
    </div>
  );
}
