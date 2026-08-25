import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export default function Buckets({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', balance: 0, budget: 0, description: '' });
  const [editingId, setEditingId] = useState(null);

  const buckets = data.buckets || [];

  const handleSave = async () => {
    if (!form.name) return alert('Name required');
    try {
      if (editingId) {
        await api.patch(`/buckets/${editingId}`, form);
      } else {
        await api.post('/buckets', form);
      }
      reload();
      setShowModal(false);
      setForm({ name: '', balance: 0, budget: 0, description: '' });
      setEditingId(null);
    } catch (err) {
      alert('Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete bucket?')) return;
    try {
      await api.delete(`/buckets/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const totalBalance = buckets.reduce((s, b) => s + (b.balance || 0), 0);
  const totalBudget = buckets.reduce((s, b) => s + (b.budget || 0), 0);

  return (
    <div>
      <h2 className="card-title-main">Budget Buckets</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Balance</div>
          <div className="metric-value" style={{ color: '#2d5a3d' }}>${totalBalance.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Budget</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>${totalBudget.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Buckets</div>
          <div className="metric-value">{buckets.length}</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', balance: 0, budget: 0, description: '' }); setEditingId(null); }} style={{ marginBottom: '20px' }}>
        ➕ Create Bucket
      </button>

      <div className="card">
        <div className="card-title">All Buckets</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Balance</th>
                <th>Budget</th>
                <th>% of Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buckets.length > 0 ? (
                buckets.map(b => (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>${(b.balance || 0).toFixed(2)}</td>
                    <td>${(b.budget || 0).toFixed(2)}</td>
                    <td>{totalBalance > 0 ? ((b.balance / totalBalance) * 100).toFixed(0) : 0}%</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(b); setEditingId(b.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(b.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8b8580' }}>No buckets</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Bucket' : 'Create Bucket'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Balance</label>
                  <input className="form-input" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Budget</label>
                  <input className="form-input" type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) })} />
                </div>
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
