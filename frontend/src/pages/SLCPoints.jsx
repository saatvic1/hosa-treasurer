import React, { useState, useEffect } from 'react';
import api from '../api';

export default function SLCPoints({ user, data, reload }) {
  const [allPoints, setAllPoints] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    if (user?.role === 'mega-admin') {
      loadAllPoints();
    } else {
      setAllPoints([]);
    }
  }, [user]);

  const loadAllPoints = async () => {
    try {
      const res = await api.get('/api/slc-points-all');
      setAllPoints(res.data || []);
    } catch (err) {
      console.error('Error loading points');
    }
  };

  const filtered = allPoints.filter(p =>
    (p.memberName || '').toLowerCase().includes(searchMember.toLowerCase()) ||
    (p.committeeName || '').toLowerCase().includes(searchMember.toLowerCase())
  );

  const totalPoints = filtered.reduce((s, p) => s + (p.rating || 0), 0);
  const membersWithPoints = [...new Set(filtered.map(p => p.memberId))].length;

  if (user?.role !== 'mega-admin') {
    return (
      <div>
        <h2 className="card-title-main">SLC Points</h2>
        <div className="card">
          <p style={{ color: '#8b8580' }}>SLC Points tracking is visible only to Mega Admins</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="card-title-main">SLC Points - Mega Admin View</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Points</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>{totalPoints}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Members Tracked</div>
          <div className="metric-value">{membersWithPoints}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Ratings</div>
          <div className="metric-value">{filtered.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('list')}
        >
          📋 List View
        </button>
        <button 
          className={`btn ${viewMode === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('summary')}
        >
          📊 Summary View
        </button>
      </div>

      <div className="card">
        <div className="card-title">Search Points</div>
        <input
          type="text"
          placeholder="Search by member or committee..."
          value={searchMember}
          onChange={(e) => setSearchMember(e.target.value)}
          className="form-input"
        />
      </div>

      {viewMode === 'list' ? (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-title">All SLC Ratings ({filtered.length})</div>
          {filtered.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Committee</th>
                    <th>Week</th>
                    <th>Rating (0-3)</th>
                    <th>Rated By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.memberName}</strong></td>
                      <td>{p.committeeName}</td>
                      <td>Week {p.week}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: p.rating >= 2 ? '#e8f4f0' : p.rating === 1 ? '#fef5f0' : '#f5f3f0',
                          color: p.rating >= 2 ? '#2d5a3d' : p.rating === 1 ? '#d4a574' : '#8b8580',
                          fontWeight: 'bold'
                        }}>
                          {p.rating}/3
                        </span>
                      </td>
                      <td>{p.ratedBy}</td>
                      <td>{new Date(p.ratedDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#8b8580' }}>No ratings found</p>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-title">Member Summary</div>
          {filtered.length > 0 ? (
            <div>
              {[...new Set(filtered.map(p => p.memberName))].map(memberName => {
                const memberPoints = filtered.filter(p => p.memberName === memberName);
                const avgRating = (memberPoints.reduce((s, p) => s + p.rating, 0) / memberPoints.length).toFixed(1);
                return (
                  <div key={memberName} style={{ padding: '16px', borderBottom: '1px solid #e8e3de' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px' }}>{memberName}</strong>
                        <p style={{ fontSize: '12px', color: '#8b8580', margin: '4px 0' }}>
                          {memberPoints.length} rating{memberPoints.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d5a3d' }}>
                          {avgRating}/3
                        </div>
                        <div style={{ fontSize: '12px', color: '#8b8580' }}>Average</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#8b8580' }}>No data available</p>
          )}
        </div>
      )}
    </div>
  );
}
