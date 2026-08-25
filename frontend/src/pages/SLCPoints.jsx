import React, { useState, useEffect } from 'react';
import api from '../api';

export default function SLCPoints({ user, data, reload }) {
  const [members, setMembers] = useState([]);
  const [memberPoints, setMemberPoints] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [data]);

  const loadData = async () => {
    try {
      setMembers(data.members || []);
      
      const points = {};
      (data.members || []).forEach(m => {
        points[m.id] = 0;
      });
      
      try {
        const res = await api.get('/slc-points-all');
        if (res.data && Array.isArray(res.data)) {
          res.data.forEach(entry => {
            if (points[entry.memberId] !== undefined) {
              points[entry.memberId] = (points[entry.memberId] || 0) + entry.points;
            }
          });
        }
      } catch (err) {
        console.log('Could not load all points (admin only)');
      }
      
      setMemberPoints(points);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleAddPoints = async () => {
    if (!selectedMember || !pointsToAdd) return alert('Select member and enter points');
    
    const pts = parseInt(pointsToAdd);
    if (isNaN(pts) || pts < 0) return alert('Enter valid points');

    setLoading(true);
    try {
      await api.post('/slc-points', {
        memberId: selectedMember.id,
        points: pts,
        reason: reason || 'Manual award'
      });
      
      setMemberPoints({
        ...memberPoints,
        [selectedMember.id]: (memberPoints[selectedMember.id] || 0) + pts
      });
      
      setShowModal(false);
      setSelectedMember(null);
      setPointsToAdd('');
      setReason('');
      
      if (reload) reload();
    } catch (err) {
      alert('Error adding points');
    }
    setLoading(false);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPoints = Object.values(memberPoints).reduce((sum, p) => sum + p, 0);

  if (user?.role !== 'mega-admin' && user?.role !== 'admin') {
    return (
      <div>
        <h2 className="card-title-main">SLC Points</h2>
        <div className="card">
          <p style={{ color: '#8b8580' }}>SLC Points management is available to admins only</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="card-title-main">SLC Points Management</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Points Awarded</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>{totalPoints}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Members Tracked</div>
          <div className="metric-value">{members.length}</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginBottom: '20px' }}>
        ⭐ Award Points to Member
      </button>

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
        {filteredMembers.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Grade</th>
                  <th>Total SLC Points</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.email}</td>
                    <td>{m.grade || '-'}</td>
                    <td>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#e8f4f0',
                        color: '#2d5a3d',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        {memberPoints[m.id] || 0} pts
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => {
                          setSelectedMember(m);
                          setShowModal(true);
                        }}
                      >
                        ⭐ Award
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#8b8580' }}>No members found</p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Award SLC Points</h2>
            
            {selectedMember && (
              <p style={{ fontSize: '14px', color: '#8b8580', marginBottom: '20px' }}>
                Member: <strong>{selectedMember.name}</strong> (Currently: <strong>{memberPoints[selectedMember.id] || 0} pts</strong>)
              </p>
            )}

            {!selectedMember && (
              <div className="form-group">
                <label className="form-label">Select Member *</label>
                <select 
                  className="form-input" 
                  onChange={(e) => {
                    const member = members.find(m => m.id === e.target.value);
                    setSelectedMember(member);
                  }}
                  defaultValue=""
                >
                  <option value="">Choose member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedMember && (
              <>
                <div className="form-group">
                  <label className="form-label">Points to Award *</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    value={pointsToAdd} 
                    onChange={(e) => setPointsToAdd(e.target.value)}
                    placeholder="Enter points (any number)"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason (Optional)</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Attendance, Leadership, Event participation"
                  />
                </div>
              </>
            )}

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowModal(false);
                  setSelectedMember(null);
                  setPointsToAdd('');
                  setReason('');
                }}
              >
                Cancel
              </button>
              {selectedMember && (
                <button className="btn btn-primary" onClick={handleAddPoints} disabled={loading}>
                  {loading ? 'Awarding...' : 'Award Points'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
