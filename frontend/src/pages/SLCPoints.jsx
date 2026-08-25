import React, { useState } from 'react';
import axios from 'axios';

export default function SLCPoints({ user, data, reload }) {
  const [searchMember, setSearchMember] = useState('');
  const [slcPoints, setSlcPoints] = useState(data.slcPoints || []);

  const members = data.members || [];
  const filtered = slcPoints.filter(p =>
    (p.memberName || '').toLowerCase().includes(searchMember.toLowerCase())
  );

  const totalPoints = slcPoints.reduce((s, p) => s + (p.points || 0), 0);

  return (
    <div>
      <h2 className="card-title-main">SLC Points</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Points</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>{totalPoints}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Members with Points</div>
          <div className="metric-value">{slcPoints.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Points by Member</div>
        <input
          type="text"
          placeholder="Search member..."
          value={searchMember}
          onChange={(e) => setSearchMember(e.target.value)}
          className="form-input"
          style={{ marginBottom: '16px' }}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Points</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td>{p.memberName}</td>
                    <td>{p.points}</td>
                    <td>{p.source || 'Attendance'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#8b8580' }}>No points found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
