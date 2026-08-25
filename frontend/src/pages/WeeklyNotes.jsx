import React, { useState, useEffect } from 'react';
import api from '../api';

export default function WeeklyNotes({ committeeId, reload }) {
  const [notes, setNotes] = useState([]);
  const [week, setWeek] = useState('1');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (committeeId) {
      loadNotes();
    }
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

  const handleSendEmail = async (noteId) => {
    const noteToSend = notes.find(n => n.id === noteId);
    if (!noteToSend) return alert('Note not found');
    
    setSendingEmail(true);
    try {
      await api.post('/email', {
        to: 'committee@hosa.com',
        subject: `Week ${noteToSend.week} Committee Update`,
        body: noteToSend.content,
        type: 'committee-update'
      });
      alert('Email sent to committee!');
    } catch (err) {
      alert('Error sending email');
    }
    setSendingEmail(false);
  };

  if (!committeeId) {
    return (
      <div>
        <h2 className="card-title-main">Weekly Notes</h2>
        <div className="card">
          <p style={{ color: '#8b8580' }}>Select a committee first</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="card-title-main">Weekly Notes</h2>

      <div className="card">
        <div className="card-title">Write Weekly Notes</div>
        
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
                    <td><strong>Week {n.week}</strong></td>
                    <td>{new Date(n.createdDate).toLocaleDateString()}</td>
                    <td>{n.content.substring(0, 50)}...</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => handleEdit(n)}>Edit</button>
                      <button className="btn btn-warning btn-small" onClick={() => handleSendEmail(n.id)} disabled={sendingEmail}>📧 Email</button>
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
    </div>
  );
}
