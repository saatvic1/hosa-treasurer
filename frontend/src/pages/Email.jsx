import React, { useState } from 'react';
import axios from 'axios';

import api from '../api';

export default function Email({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ to: '', subject: '', body: '', type: 'announcement' });
  const [selectedMembers, setSelectedMembers] = useState([]);

  const members = data.members || [];
  const emailHistory = data.emailHistory || [];

  const handleSendEmail = async () => {
    if (!form.to && selectedMembers.length === 0) return alert('Select recipients');
    if (!form.subject || !form.body) return alert('Fill subject and body');
    
    try {
      const recipients = form.to ? [form.to] : selectedMembers;
      await api.post('/email', {
        to: recipients,
        subject: form.subject,
        body: form.body,
        type: form.type,
      });
      reload();
      setShowModal(false);
      setForm({ to: '', subject: '', body: '', type: 'announcement' });
      setSelectedMembers([]);
      alert('Email sent!');
    } catch (err) {
      alert('Error sending email');
    }
  };

  const toggleMember = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  return (
    <div>
      <h2 className="card-title-main">Email</h2>

      <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginBottom: '20px' }}>
        ✉️ Send Email
      </button>

      <div className="card">
        <div className="card-title">Email History ({emailHistory.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Recipients</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {emailHistory.length > 0 ? (
                emailHistory.map(e => (
                  <tr key={e.id}>
                    <td>{e.sentAt ? new Date(e.sentAt).toLocaleDateString() : '-'}</td>
                    <td>{e.subject}</td>
                    <td>{e.recipientCount || 0}</td>
                    <td><span className="badge badge-blue">{e.type}</span></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#8b8580' }}>No emails sent</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Send Email</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSendEmail(); }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="announcement">Announcement</option>
                  <option value="dues-reminder">Dues Reminder</option>
                  <option value="event-update">Event Update</option>
                  <option value="committee-message">Committee Message</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Send to Email</label>
                <input className="form-input" type="email" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="or select members below" />
              </div>

              <div className="form-group">
                <label className="form-label">Or Select Members</label>
                <div style={{ border: '1px solid #d4ccc8', borderRadius: '6px', padding: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                  {members.length > 0 ? (
                    members.map(m => (
                      <div key={m.id} style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(m.id)}
                            onChange={() => toggleMember(m.id)}
                          />
                          {m.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#8b8580', fontSize: '13px' }}>No members</p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input className="form-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-input" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ minHeight: '120px' }} required />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
