import React, { useState, useEffect } from 'react';
import api from '../api';

export default function WeeklyNotes({ committeeId, reload }) {
  const [notes, setNotes] = useState([]);
  const [week, setWeek] = useState('1');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [committeeId]);

  const loadNotes = async () => {
    try {
      const res = await api.get(`/committees/${committeeId}/weekly-notes`);
      setNotes(res.data || []);
    } catch (err) {
      console.error('Error loading notes');
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return alert('Content required');
    setLoading(true);
    try {
      if (editingId) {
        await api.patch(`/weekly-notes/${editingId}`, { content });
      } else {
        await api.post(`/committees/${committeeId}/weekly-notes`, { week, content });
      }
      setContent('');
      setWeek('1');
      setEditingId(null);
      loadNotes();
      if (reload) reload();
    } catch (err) {
      alert('Error saving note');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete note?')) return;
    try {
      await api.delete(`/weekly-notes/${id}`);
      loadNotes();
    } catch (err) {
      alert('Error deleting note');
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setWeek(note.week);
    setContent(note.content);
  };

  const handleSendEmail = async () => {
    const noteToSend = notes.find(n => n.week === week);
    if (!noteToSend) return alert('No notes for this week');
    
    try {
      await api.post('/api/email', {
        to: 'committee@hosa.com',
        subject: `Week ${week} Committee Notes`,
        body: noteToSend.content,
        type: 'committee-update'
      });
      alert('Email sent!');
    } catch (err) {
      alert('Error sending email');
    }
  };

  return (
    <div>
      <h2 className="card-title-main">Weekly Notes - Committee</h2>

      <div className="card">
        <div className="card-title">Write Notes</div>
        
        <div className="form-group">
          <label className="form-label">Week Number</label>
          <input 
            className="form-input" 
            type="number" 
            value={week} 
            onChange={(e) => setWeek(e.target.value)} 
            min="1"
            max="52"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Content *</label>
          <textarea 
            className="form-input" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="Write your weekly notes here..."
            style={{ minHeight: '200px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={loading}
          >
            {editingId ? '✏️ Update Note' : '➕ Save Note'}
          </button>
          {editingId && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setEditingId(null);
                setContent('');
                setWeek('1');
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">All Notes ({notes.length})</div>
        {notes.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Date</th>
                  <th>Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notes.map(n => (
                  <tr key={n.id}>
                    <td>Week {n.week}</td>
                    <td>{new Date(n.createdDate).toLocaleDateString()}</td>
                    <td>{n.content.substring(0, 50)}...</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => handleEdit(n)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(n.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#8b8580' }}>No notes yet</p>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px', background: '#f5f3f0' }}>
        <div className="card-title">Send Week Notes via Email</div>
        <p style={{ fontSize: '13px', color: '#8b8580', marginBottom: '16px' }}>
          Select a week and send its notes to committee members via email
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="form-input" value={week} onChange={(e) => setWeek(e.target.value)} style={{ flex: 1 }}>
            {notes.map(n => (
              <option key={n.id} value={n.week}>Week {n.week}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleSendEmail}>📧 Send Email</button>
        </div>
      </div>
    </div>
  );
}
