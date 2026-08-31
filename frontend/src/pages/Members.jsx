import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Members({ user, data, reload }) {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', grade: '', ctePathway: false, roles: [], committees: [], notes: '' });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    setMembers(data.members || []);
    setCommittees(data.committees || []);
  }, [data]);

  const handleSave = async () => {
    if (!form.name || !form.email) return alert('Name and email required');
    try {
      if (editingId) {
        await api.patch(`/members/${editingId}`, form);
      } else {
        await api.post('/members', form);
      }
      reload();
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', grade: '', ctePathway: false, roles: [], committees: [], notes: '' });
      setEditingId(null);
    } catch (err) {
      alert('Error saving member');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete member?')) return;
    try {
      await api.delete(`/members/${id}`);
      reload();
    } catch (err) {
      alert('Error deleting member');
    }
  };

  const handleRoleChange = (role) => {
    const newRoles = form.roles.includes(role) 
      ? form.roles.filter(r => r !== role)
      : [...form.roles, role];
    setForm({ ...form, roles: newRoles });
  };

  const handleCommitteeChange = (committeeId) => {
    const newCommittees = form.committees.includes(committeeId)
      ? form.committees.filter(c => c !== committeeId)
      : [...form.committees, committeeId];
    setForm({ ...form, committees: newCommittees });
  };

  const generatePDF = () => {
    let pdf = '=== MEMBERS EXPORT ===\n\n';
    members.forEach(m => {
      pdf += `Name: ${m.name}\nEmail: ${m.email}\nGrade: ${m.grade || '-'}\nPhone: ${m.phone || '-'}\nCTE Pathway (Affiliated): ${m.ctePathway ? 'YES' : 'NO'}\nRoles: ${m.roles?.join(', ') || 'Regular'}\nCommittees: ${m.committees?.length || 0}\nNotes: ${m.notes || '-'}\n\n`;
    });
    const element = document.createElement('a');
    element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdf);
    element.download = 'members-export.txt';
    element.click();
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="card-title-main">Members</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm({ name: '', email: '', phone: '', grade: '', ctePathway: false, roles: [], committees: [], notes: '' }); setEditingId(null); }}>
          ➕ Add Member
        </button>
        <button className="btn btn-secondary" onClick={generatePDF}>
          📄 Export PDF
        </button>
      </div>

      <div className="card">
        <div className="card-title">Search Members</div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">All Members ({filteredMembers.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Affiliated</th>
                <th>Roles</th>
                <th>Committees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.email}</td>
                    <td>{m.grade || '-'}</td>
                    <td>{m.ctePathway ? '✅ YES' : '❌ NO'}</td>
                    <td>{m.roles?.join(', ') || 'Regular'}</td>
                    <td>{m.committees?.length || 0}</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setForm(m); setEditingId(m.id); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(m.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#8b8580' }}>No members found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="modal-title">{editingId ? 'Edit Member' : 'Add Member'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Grade</label>
                <input className="form-input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
                  <input 
                    type="checkbox" 
                    checked={form.ctePathway} 
                    onChange={(e) => setForm({ ...form, ctePathway: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>✅ CTE Pathway Member (Affiliated)</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Roles (Select All That Apply)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Regular Member', 'Committee Lead', 'SLC Participant', 'FLC Participant'].map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.roles?.includes(role)} onChange={() => handleRoleChange(role)} />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Committees (Select All That Apply)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {committees.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.committees?.includes(c.id)} onChange={() => handleCommitteeChange(c.id)} />
                      {c.name}
                    </label>
                  ))}
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
