import React, { useState } from 'react';
import axios from 'axios';

import api from '../api';

export default function Equipment({ user, data, reload }) {
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', type: '', condition: 'good', value: 0, notes: '' });
  const [checkoutForm, setCheckoutForm] = useState({ itemId: '', memberId: '', checkoutDate: '', notes: '' });
  const [editingId, setEditingId] = useState(null);

  const items = data.equipment || [];
  const logs = data.equipmentLogs || [];
  const members = data.members || [];

  const handleSaveItem = async () => {
    if (!itemForm.name) return alert('Item name required');
    try {
      if (editingId) {
        await api.patch(`/equipment/${editingId}`, itemForm);
      } else {
        await api.post('/equipment', itemForm);
      }
      reload();
      setShowItemModal(false);
      setItemForm({ name: '', type: '', condition: 'good', value: 0, notes: '' });
      setEditingId(null);
    } catch (err) {
      alert('Error');
    }
  };

  const handleCheckout = async () => {
    if (!checkoutForm.itemId || !checkoutForm.memberId) return alert('Select item and member');
    try {
      await api.post('/equipment-logs', { ...checkoutForm, status: 'checked-out' });
      reload();
      setShowCheckoutModal(false);
      setCheckoutForm({ itemId: '', memberId: '', checkoutDate: '', notes: '' });
    } catch (err) {
      alert('Error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete item?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  const checkedOut = logs.filter(l => l.status === 'checked-out').length;
  const totalValue = items.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <div>
      <h2 className="card-title-main">Equipment</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Items</div>
          <div className="metric-value">{items.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Checked Out</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>{checkedOut}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Value</div>
          <div className="metric-value" style={{ color: '#2d5a3d' }}>${totalValue.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => { setShowItemModal(true); setItemForm({ name: '', type: '', condition: 'good', value: 0, notes: '' }); setEditingId(null); }}>
          ➕ Add Item
        </button>
        <button className="btn btn-secondary" onClick={() => setShowCheckoutModal(true)}>
          📦 Checkout Item
        </button>
      </div>

      <div className="card">
        <div className="card-title">Equipment Inventory</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Condition</th>
                <th>Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map(i => {
                  const checkedOut = logs.find(l => l.itemId === i.id && l.status === 'checked-out');
                  return (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td>{i.type || '-'}</td>
                      <td><span className={`badge badge-${i.condition === 'excellent' ? 'green' : i.condition === 'good' ? 'blue' : 'amber'}`}>{i.condition}</span></td>
                      <td>${(i.value || 0).toFixed(2)}</td>
                      <td><span className={`badge badge-${checkedOut ? 'amber' : 'green'}`}>{checkedOut ? 'Out' : 'Available'}</span></td>
                      <td>
                        <button className="btn btn-secondary btn-small" onClick={() => { setItemForm(i); setEditingId(i.id); setShowItemModal(true); }}>Edit</button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteItem(i.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8b8580' }}>No items</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showItemModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Item' : 'Add Item'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(); }}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input className="form-input" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <input className="form-input" value={itemForm.type} onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })} placeholder="e.g. Suit, Stethoscope" />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select className="form-input" value={itemForm.condition} onChange={(e) => setItemForm({ ...itemForm, condition: e.target.value })}>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Value ($)</label>
                <input className="form-input" type="number" step="0.01" value={itemForm.value} onChange={(e) => setItemForm({ ...itemForm, value: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Checkout Item</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
              <div className="form-group">
                <label className="form-label">Item *</label>
                <select className="form-input" value={checkoutForm.itemId} onChange={(e) => setCheckoutForm({ ...checkoutForm, itemId: e.target.value })} required>
                  <option value="">Select item...</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Member *</label>
                <select className="form-input" value={checkoutForm.memberId} onChange={(e) => setCheckoutForm({ ...checkoutForm, memberId: e.target.value })} required>
                  <option value="">Select member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Checkout Date</label>
                <input className="form-input" type="date" value={checkoutForm.checkoutDate} onChange={(e) => setCheckoutForm({ ...checkoutForm, checkoutDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={checkoutForm.notes} onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Checkout</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
