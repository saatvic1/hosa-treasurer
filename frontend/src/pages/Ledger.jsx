import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export default function Ledger({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: '', type: 'income', amount: 0, description: '', bucket: '', reference: '' });
  const [editingId, setEditingId] = useState(null);

  const transactions = data.transactions || [];
  const buckets = data.buckets || [];

  const handleSave = async () => {
    if (!form.amount) return alert('Amount required');
    try {
      if (editingId) {
        await api.patch(`/transactions/${editingId}`, form);
      } else {
        await api.post('/transactions', form);
      }
      reload();
      setShowModal(false);
      setForm({ date: '', type: 'income', amount: 0, description: '', bucket: '', reference: '' });
      setEditingId(null);
    } catch (err) {
      alert('Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div>
      <h2 className="card-title-main">Ledger</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Income</div>
          <div className="metric-value" style={{ color: '#2d5a3d' }}>${totalIncome.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Expense</div>
          <div className="metric-value" style={{ color: '#b84c4c' }}>${totalExpense.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Balance</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>${balance.toFixed(2)}</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ date: '', type: 'income', amount: 0, description: '', bucket: '', reference: '' }); setEditingId(null); }} style={{ marginBottom: '20px' }}>
        ➕ Add Transaction
      </button>

      <div className="card">
        <div className="card-title">All Transactions ({transactions.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Bucket</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td>{t.date || '-'}</td>
                    <td>{t.description}</td>
                    <td><span className={`badge badge-${t.type === 'income' ? 'green' : 'red'}`}>{t.type}</span></td>
                    <td>${(t.amount || 0).toFixed(2)}</td>
                    <td>{t.bucket || '-'}</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(t); setEditingId(t.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8b8580' }}>No transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Amount *</label>
                <input className="form-input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Bucket</label>
                <select className="form-input" value={form.bucket} onChange={(e) => setForm({ ...form, bucket: e.target.value })}>
                  <option value="">Select bucket...</option>
                  {buckets.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
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
