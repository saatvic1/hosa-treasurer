import React, { useState } from 'react';
import axios from 'axios';

import api from '../api';

export default function Events({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', location: '', description: '', attendees: 0 });
  const [editingId, setEditingId] = useState(null);

  const events = data.events || [];

  const handleSave = async () => {
    if (!form.name) return alert('Event name required');
    try {
      if (editingId) {
        await api.patch(`/events/${editingId}`, form);
      } else {
        await api.post('/events', form);
      }
      reload();
      setShowModal(false);
      setForm({ name: '', date: '', location: '', description: '', attendees: 0 });
      setEditingId(null);
    } catch (err) {
      alert('Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete event?')) return;
    try {
      await api.delete(`/events/${id}`);
      reload();
    } catch (err) {
      alert('Error');
    }
  };

  return (
    <div>
      <h2 className="card-title-main">Events</h2>

      <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', date: '', location: '', description: '', attendees: 0 }); setEditingId(null); }} style={{ marginBottom: '20px' }}>
        ➕ Add Event
      </button>

      <div className="card">
        <div className="card-title">All Events ({events.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Attendees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length > 0 ? (
                events.map(e => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.date || '-'}</td>
                    <td>{e.location || '-'}</td>
                    <td>{e.attendees || 0}</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(e); setEditingId(e.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(e.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#8b8580' }}>No events</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingId ? 'Edit Event' : 'Add Event'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Attendees</label>
                <input className="form-input" type="number" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: parseInt(e.target.value) })} />
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
