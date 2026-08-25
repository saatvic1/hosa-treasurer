import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Committees({ user, data, reload }) {
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSLCModal, setShowSLCModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', chair: '', schedule: '', defaultPts: 0 });
  const [editingId, setEditingId] = useState(null);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(null);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');
  const [selectedMemberForSLC, setSelectedMemberForSLC] = useState(null);
  const [slcWeek, setSlcWeek] = useState('1');
  const [slcRating, setSlcRating] = useState('0');

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

  const loadCommitteeMembers = async (committeeId) => {
    try {
      const res = await api.get(`/committees/${committeeId}/members`);
      setCommitteeMembers(res.data || []);
      setSelectedCommitteeId(committeeId);
      setShowMembersModal(true);
    } catch (err) {
      alert('Error loading members');
    }
  };

  const handleAddMember = async () => {
    if (!selectedMemberToAdd) return alert('Select a member');
    try {
      await api.post(`/committees/${selectedCommitteeId}/members`, { memberId: selectedMemberToAdd });
      setSelectedMemberToAdd('');
      loadCommitteeMembers(selectedCommitteeId);
    } catch (err) {
      alert('Error adding member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove member?')) return;
    try {
      await api.delete(`/committees/${selectedCommitteeId}/members/${memberId}`);
      loadCommitteeMembers(selectedCommitteeId);
    } catch (err) {
      alert('Error removing member');
    }
  };

  const handleAssignSLC = async () => {
    if (!selectedMemberForSLC) return;
    try {
      await api.post(`/committees/${selectedCommitteeId}/slc-points`, {
        memberId: selectedMemberForSLC.memberId,
        week: slcWeek,
        rating: parseInt(slcRating)
      });
      setShowSLCModal(false);
      setSelectedMemberForSLC(null);
      setSlcWeek('1');
      setSlcRating('0');
      loadCommitteeMembers(selectedCommitteeId);
    } catch (err) {
      alert('Error assigning SLC points');
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
                <th>Members</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {committees.length > 0 ? (
                committees.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{members.find(m => m.id === c.chair)?.name || '-'}</td>
                    <td>{c.schedule || '-'}</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => loadCommitteeMembers(c.id)}>
                        Manage
                      </button>
                    </td>
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

      {/* CREATE/EDIT COMMITTEE MODAL */}
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

      {/* MANAGE MEMBERS MODAL */}
      {showMembersModal && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 className="modal-title">Manage Committee Members</h2>
            
            <div className="form-group">
              <label className="form-label">Add Member</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select className="form-input" value={selectedMemberToAdd} onChange={(e) => setSelectedMemberToAdd(e.target.value)} style={{ flex: 1 }}>
                  <option value="">Select member...</option>
                  {members.filter(m => !committeeMembers.find(cm => cm.memberId === m.id)).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={handleAddMember}>Add</button>
              </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-title">Current Members ({committeeMembers.length})</div>
              {committeeMembers.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {committeeMembers.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e8e3de' }}>
                      <div>
                        <strong>{m.memberName}</strong>
                        <p style={{ fontSize: '12px', color: '#8b8580', margin: '2px 0' }}>{m.memberEmail}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-primary btn-small" 
                          onClick={() => {
                            setSelectedMemberForSLC(m);
                            setShowSLCModal(true);
                          }}
                        >
                          ⭐ Rate
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#8b8580' }}>No members yet</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMembersModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SLC POINTS RATING MODAL */}
      {showSLCModal && selectedMemberForSLC && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Assign SLC Points</h2>
            <p style={{ color: '#8b8580', marginBottom: '20px' }}>
              Rating for: <strong>{selectedMemberForSLC.memberName}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">Week Number</label>
              <input 
                className="form-input" 
                type="number" 
                value={slcWeek} 
                onChange={(e) => setSlcWeek(e.target.value)} 
                min="1"
                max="52"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Participation Rating (0-3)</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                {[0, 1, 2, 3].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setSlcRating(String(rating))}
                    style={{
                      flex: 1,
                      padding: '16px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      border: slcRating === String(rating) ? '2px solid #2d5a3d' : '2px solid #e8e3de',
                      borderRadius: '8px',
                      background: slcRating === String(rating) ? '#e8f4f0' : '#f5f3f0',
                      color: slcRating === String(rating) ? '#2d5a3d' : '#8b8580',
                      cursor: 'pointer'
                    }}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#8b8580', marginTop: '8px' }}>
                0 = No participation | 3 = Excellent participation
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowSLCModal(false); setSelectedMemberForSLC(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignSLC}>Save Rating</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
