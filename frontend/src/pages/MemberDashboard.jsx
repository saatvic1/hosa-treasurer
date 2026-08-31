import React, { useState, useEffect } from 'react';
import api from '../api';

export default function MemberDashboard({ user, data }) {
  const [memberInfo, setMemberInfo] = useState(null);
  const [committees, setCommittees] = useState([]);
  const [outstandingFees, setOutstandingFees] = useState([]);
  const [slcPoints, setSlcPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);

  useEffect(() => {
    loadMemberData();
  }, [user, data]);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      
      // Find member by email
      const allMembers = data.members || [];
      const currentMember = allMembers.find(m => m.email === user.email);
      
      if (!currentMember) {
        setLoading(false);
        return;
      }
      
      setMemberInfo(currentMember);
      
      // Get their committees
      const allCommittees = data.committees || [];
      const memberCommittees = allCommittees.filter(c => currentMember.committees?.includes(c.id));
      setCommittees(memberCommittees);
      
      // Get all fees
      try {
        const feesRes = await api.get('/fee-categories');
        setFees(feesRes.data || []);
      } catch (err) {
        console.log('Could not load fee categories');
      }
      
      // Get their outstanding fees
      try {
        const feesRes = await api.get('/member-fees');
        const allMemberFees = feesRes.data || [];
        const memberOutstandingFees = allMemberFees.filter(
          f => f.memberId === currentMember.id && !f.paid
        );
        
        // Enrich with fee names
        const enriched = memberOutstandingFees.map(f => {
          const feeInfo = (feesRes.data || []).find(fee => fee.id === f.feeId);
          return {
            ...f,
            feeName: f.feeName || feeInfo?.name || 'Unknown Fee'
          };
        });
        
        setOutstandingFees(enriched);
      } catch (err) {
        console.log('Could not load fees');
      }
      
      // Get their SLC points
      try {
        const pointsRes = await api.get('/slc-points-all');
        const allPoints = pointsRes.data || [];
        const memberTotal = allPoints
          .filter(p => p.memberId === currentMember.id)
          .reduce((sum, p) => sum + (p.points || 0), 0);
        setSlcPoints(memberTotal);
      } catch (err) {
        console.log('Could not load points');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading member data:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="card-title-main">Loading...</h2>
      </div>
    );
  }

  if (!memberInfo) {
    return (
      <div>
        <h2 className="card-title-main">Member Portal</h2>
        <div className="card">
          <p style={{ color: '#8b8580' }}>No member profile found for this email address. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const feeTotal = outstandingFees.reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div>
      <h2 className="card-title-main">👋 Welcome, {memberInfo.name}!</h2>

      {/* Member Info Card */}
      <div className="card">
        <div className="card-title">Your Profile</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#8b8580', marginBottom: '4px' }}>NAME</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{memberInfo.name}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#8b8580', marginBottom: '4px' }}>EMAIL</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{memberInfo.email}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#8b8580', marginBottom: '4px' }}>GRADE</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{memberInfo.grade || '-'}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#8b8580', marginBottom: '4px' }}>AFFILIATED</p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: memberInfo.ctePathway ? '#2d5a3d' : '#8b8580' }}>
              {memberInfo.ctePathway ? '✅ YES' : '❌ NO'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid" style={{ marginTop: '20px' }}>
        <div className="metric-card">
          <div className="metric-label">Your Committees</div>
          <div className="metric-value">{committees.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">SLC Points Earned</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>{slcPoints}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Outstanding Fees</div>
          <div className="metric-value" style={{ color: outstandingFees.length > 0 ? '#d4a574' : '#2d5a3d' }}>
            ${feeTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Committees */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">Your Committees ({committees.length})</div>
        {committees.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Committee</th>
                  <th>Schedule</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {committees.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.schedule || '-'}</td>
                    <td>{c.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#8b8580' }}>You're not assigned to any committees yet.</p>
        )}
      </div>

      {/* Outstanding Fees */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">Outstanding Fees ({outstandingFees.length})</div>
        {outstandingFees.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outstandingFees.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.feeName}</strong></td>
                    <td><strong>${f.amount}</strong></td>
                    <td>{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: '#f5e3de',
                        color: '#d4a574',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ⏳ UNPAID
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#2d5a3d', fontWeight: '600' }}>✅ No outstanding fees!</p>
        )}
      </div>

      {/* Notes Section */}
      {memberInfo.notes && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-title">Notes</div>
          <p style={{ color: '#8b8580' }}>{memberInfo.notes}</p>
        </div>
      )}
    </div>
  );
}
