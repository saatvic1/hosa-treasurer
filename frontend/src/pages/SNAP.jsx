import React, { useState } from 'react';
import axios from 'axios';

import api from '../api';

export default function SNAP({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [form, setForm] = useState({ name: '', goal: 0, raised: 0, date: '', status: 'active' });
  const [csvData, setCsvData] = useState('');
  const [editingId, setEditingId] = useState(null);

  const campaigns = data.snapCampaigns || [];

  const handleSave = async () => {
    if (!form.name) return alert('Campaign name required');
    try {
      if (editingId) {
        await api.patch(`/snap-campaigns/${editingId}`, form);
      } else {
        await api.post('/snap-campaigns', form);
      }
      reload();
      setShowModal(false);
      setForm({ name: '', goal: 0, raised: 0, date: '', status: 'active' });
      setEditingId(null);
    } catch (err) {
      alert('Error saving campaign');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete campaign?')) return;
    try {
      await api.delete(`/snap-campaigns/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) return alert('Paste CSV data');
    try {
      await api.post('/import-snap', { csvData });
      reload();
      setShowImportModal(false);
      setCsvData('');
    } catch (err) {
      alert('Import error');
    }
  };

  const totalRaised = campaigns.reduce((s, c) => s + (c.raised || 0), 0);

  return (
    <div>
      <h2 className="card-title-main">SNAP Campaigns</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Raised</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>${totalRaised.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', goal: 0, raised: 0, date: '', status: 'active' }); setEditingId(null); }}>
          ➕ New Campaign
        </button>
        <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
          📋 Import from CSV
        </button>
      </div>

      <div className="card">
        <div className="card-title">All Campaigns ({campaigns.length})</div>
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
              {campaigns.length > 0 ? (
                campaigns.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>${(c.goal || 0).toFixed(2)}</td>
                    <td>${(c.raised || 0).toFixed(2)}</td>
                    <td>{c.goal > 0 ? ((c.raised / c.goal) * 100).toFixed(0) : 0}%</td>
                    <td><span className={`badge badge-${c.status === 'active' ? 'blue' : 'gray'}`}>{c.status}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(c); setEditingId(c.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8b8580' }}>No campaigns</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Campaign' : 'New Campaign'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Campaign Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Goal</label>
                  <input className="form-input" type="number" step="0.01" value={form.goal} onChange={(e) => setForm({ ...form, goal: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Raised</label>
                  <input className="form-input" type="number" step="0.01" value={form.raised} onChange={(e) => setForm({ ...form, raised: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Import from CSV</h2>
            <p style={{ fontSize: '13px', color: '#8b8580', marginBottom: '16px' }}>Format: memberName, amount</p>
            <textarea className="form-input" style={{ minHeight: '120px' }} value={csvData} onChange={(e) => setCsvData(e.target.value)} placeholder="name1, 100&#10;name2, 50" />
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleImport}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
