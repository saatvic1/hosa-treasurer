import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export default function Dues({ user, data, reload }) {
  const [showCatModal, setShowCatModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', amount: 0, description: '' });
  const [feeForm, setFeeForm] = useState({ memberId: '', categoryId: '', dueDate: '', paid: false });
  const [editingId, setEditingId] = useState(null);

  const categories = data.fees || [];
  const memberFees = data.memberFees || [];
  const members = data.members || [];

  const handleSaveCat = async () => {
    if (!catForm.name) return alert('Name required');
    try {
      if (editingId) {
        await api.patch(`/fee-categories/${editingId}`, catForm);
      } else {
        await api.post('/fee-categories', catForm);
      }
      reload();
      setShowCatModal(false);
      setCatForm({ name: '', amount: 0, description: '' });
      setEditingId(null);
    } catch (err) {
      alert('Error');
    }
  };

  const handleSaveFee = async () => {
    if (!feeForm.memberId || !feeForm.categoryId) return alert('Select member and category');
    try {
      await api.post('/member-fees', feeForm);
      reload();
      setShowFeeModal(false);
      setFeeForm({ memberId: '', categoryId: '', dueDate: '', paid: false });
    } catch (err) {
      alert('Error');
    }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Delete category?')) return;
    try {
      await api.delete(`/fee-categories/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const totalOwed = memberFees.filter(f => !f.paid).reduce((s, f) => s + (f.amount || 0), 0);
  const paidFees = memberFees.filter(f => f.paid).length;

  return (
    <div>
      <h2 className="card-title-main">Dues & Fees</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Outstanding</div>
          <div className="metric-value" style={{ color: '#b84c4c' }}>${totalOwed.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Fees Paid</div>
          <div className="metric-value" style={{ color: '#2d5a3d' }}>{paidFees}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => { setShowCatModal(true); setCatForm({ name: '', amount: 0, description: '' }); setEditingId(null); }}>
          ➕ Add Fee Category
        </button>
        <button className="btn btn-secondary" onClick={() => setShowFeeModal(true)}>
          💳 Assign Fee
        </button>
      </div>

      <div className="card">
        <div className="card-title">Fee Categories</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>${(c.amount || 0).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setCatForm(c); setEditingId(c.id); setShowCatModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteCat(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#8b8580' }}>No categories</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">Member Fees ({memberFees.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {memberFees.length > 0 ? (
                memberFees.map(f => (
                  <tr key={f.id}>
                    <td>{f.memberName || '-'}</td>
                    <td>{f.categoryName || '-'}</td>
                    <td>${(f.amount || 0).toFixed(2)}</td>
                    <td>{f.dueDate || '-'}</td>
                    <td><span className={`badge badge-${f.paid ? 'green' : 'red'}`}>{f.paid ? 'Paid' : 'Outstanding'}</span></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8b8580' }}>No fees assigned</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCatModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Category' : 'Add Fee Category'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveCat(); }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input className="form-input" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input className="form-input" type="number" step="0.01" value={catForm.amount} onChange={(e) => setCatForm({ ...catForm, amount: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeeModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Assign Fee</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveFee(); }}>
              <div className="form-group">
                <label className="form-label">Member *</label>
                <select className="form-input" value={feeForm.memberId} onChange={(e) => setFeeForm({ ...feeForm, memberId: e.target.value })} required>
                  <option value="">Select member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input" value={feeForm.categoryId} onChange={(e) => setFeeForm({ ...feeForm, categoryId: e.target.value })} required>
                  <option value="">Select category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - ${(c.amount || 0).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={feeForm.dueDate} onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFeeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
