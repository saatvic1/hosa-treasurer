import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Fees({ user, data, reload }) {
  const [fees, setFees] = useState([]);
  const [memberFees, setMemberFees] = useState([]);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ name: '', amount: 0, description: '' });
  const [editingFeeId, setEditingFeeId] = useState(null);
  const [applyFilter, setApplyFilter] = useState('');
  const [selectedFee, setSelectedFee] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadData();
    setMembers(data.members || []);
  }, [data]);

  const loadData = async () => {
    try {
      const res = await api.get('/fee-categories');
      setFees(res.data || []);
      const res2 = await api.get('/member-fees');
      setMemberFees(res2.data || []);
    } catch (err) {
      console.error('Error loading fees');
    }
  };

  const handleSaveFee = async () => {
    if (!feeForm.name || !feeForm.amount) return alert('Name and amount required');
    try {
      if (editingFeeId) {
        await api.patch(`/fee-categories/${editingFeeId}`, feeForm);
      } else {
        await api.post('/fee-categories', feeForm);
      }
      loadData();
      setShowFeeModal(false);
      setFeeForm({ name: '', amount: 0, description: '' });
      setEditingFeeId(null);
    } catch (err) {
      alert('Error saving fee');
    }
  };

  const handleDeleteFee = async (id) => {
    if (!window.confirm('Delete fee?')) return;
    try {
      await api.delete(`/fee-categories/${id}`);
      loadData();
    } catch (err) {
      alert('Error deleting fee');
    }
  };

  const handleApplyFees = async () => {
    if (!selectedFee || !applyFilter) return alert('Select fee and filter');
    
    let targetMembers = [];
    if (applyFilter === 'cte') {
      targetMembers = members.filter(m => m.ctePathway);
    } else if (applyFilter === 'slc') {
      targetMembers = members.filter(m => m.roles?.includes('SLC Participant'));
    } else if (applyFilter === 'flc') {
      targetMembers = members.filter(m => m.roles?.includes('FLC Participant'));
    }

    if (targetMembers.length === 0) return alert('No members match this filter');
    if (!window.confirm(`Apply fee to ${targetMembers.length} members?`)) return;

    try {
      const fee = fees.find(f => f.id === selectedFee);
      for (let member of targetMembers) {
        await api.post('/member-fees', {
          memberId: member.id,
          feeId: selectedFee,
          amount: fee.amount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paid: false
        });
      }
      loadData();
      setShowApplyModal(false);
      setApplyFilter('');
      setSelectedFee('');
      alert(`Fee applied to ${targetMembers.length} members!`);
    } catch (err) {
      alert('Error applying fees');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const mf = memberFees.find(m => m.id === id);
      await api.patch(`/member-fees/${id}`, { ...mf, paid: true });
      loadData();
    } catch (err) {
      alert('Error updating fee');
    }
  };

  const handleSendInvoice = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return alert('Member not found');
    
    const memberMFs = memberFees.filter(mf => mf.memberId === memberId && !mf.paid);
    if (memberMFs.length === 0) return alert('No unpaid fees for this member');

    const total = memberMFs.reduce((sum, mf) => sum + (mf.amount || 0), 0);
    
    try {
      await api.post('/email', {
        to: member.email,
        subject: 'Invoice - Outstanding Fees',
        body: `Dear ${member.name},\n\nYou have outstanding fees totaling $${total.toFixed(2)}.\n\nPlease remit payment at your earliest convenience.\n\nThank you!`,
        type: 'invoice'
      });
      alert('Invoice sent to ' + member.email);
    } catch (err) {
      alert('Error sending invoice');
    }
  };

  const generatePDF = () => {
    let pdf = '=== FEES EXPORT ===\n\n--- Fee Categories ---\n';
    fees.forEach(f => {
      pdf += `${f.name}: $${f.amount}\n`;
    });
    pdf += '\n--- Member Fees ---\n';
    memberFees.forEach(mf => {
      const member = members.find(m => m.id === mf.memberId);
      const fee = fees.find(f => f.id === mf.feeId);
      pdf += `${member?.name || '-'}: ${fee?.name || '-'} - $${mf.amount} - ${mf.paid ? 'PAID' : 'UNPAID'}\n`;
    });
    const element = document.createElement('a');
    element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdf);
    element.download = 'fees-export.txt';
    element.click();
  };

  const unpaidTotal = memberFees.filter(mf => !mf.paid).reduce((sum, mf) => sum + (mf.amount || 0), 0);

  return (
    <div>
      <h2 className="card-title-main">Fees & Billing</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => { setShowFeeModal(true); setFeeForm({ name: '', amount: 0, description: '' }); setEditingFeeId(null); }}>
          ➕ Add Fee Category
        </button>
        <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
          💰 Apply Fees to Group
        </button>
        <button className="btn btn-secondary" onClick={generatePDF}>
          📄 Export PDF
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Unpaid Fees</div>
          <div className="metric-value" style={{ color: '#d4a574' }}>${unpaidTotal.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Members with Fees</div>
          <div className="metric-value">{new Set(memberFees.map(mf => mf.memberId)).size}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Fee Categories ({fees.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fee Name</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.length > 0 ? (
                fees.map(f => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>${f.amount}</td>
                    <td>{f.description || '-'}</td>
                    <td>
                      <button className="btn btn-secondary btn-small" onClick={() => { setFeeForm(f); setEditingFeeId(f.id); setShowFeeModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteFee(f.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#8b8580' }}>No fee categories</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">Member Fees ({memberFees.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Fee</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {memberFees.length > 0 ? (
                memberFees.map(mf => {
                  const member = members.find(m => m.id === mf.memberId);
                  const fee = fees.find(f => f.id === mf.feeId);
                  return (
                    <tr key={mf.id}>
                      <td>{member?.name || '-'}</td>
                      <td>{fee?.name || '-'}</td>
                      <td>${mf.amount}</td>
                      <td>{mf.dueDate ? new Date(mf.dueDate).toLocaleDateString() : '-'}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: mf.paid ? '#e8f4f0' : '#f5e3de',
                          color: mf.paid ? '#2d5a3d' : '#d4a574',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {mf.paid ? '✅ PAID' : '⏳ UNPAID'}
                        </span>
                      </td>
                      <td>
                        {!mf.paid && (
                          <>
                            <button className="btn btn-primary btn-small" onClick={() => handleMarkPaid(mf.id)}>Mark Paid</button>
                            <button className="btn btn-warning btn-small" onClick={() => handleSendInvoice(mf.memberId)}>📧 Invoice</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8b8580' }}>No member fees</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFeeModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">{editingFeeId ? 'Edit Fee' : 'Add Fee'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveFee(); }}>
              <div className="form-group">
                <label className="form-label">Fee Name *</label>
                <input className="form-input" value={feeForm.name} onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount *</label>
                <input className="form-input" type="number" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: parseFloat(e.target.value) })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={feeForm.description} onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFeeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApplyModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2 className="modal-title">Apply Fees to Group</h2>
            <div className="form-group">
              <label className="form-label">Select Filter *</label>
              <select className="form-input" value={applyFilter} onChange={(e) => setApplyFilter(e.target.value)}>
                <option value="">Choose...</option>
                <option value="cte">CTE Pathway Members</option>
                <option value="slc">SLC Participants</option>
                <option value="flc">FLC Participants</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select Fee *</label>
              <select className="form-input" value={selectedFee} onChange={(e) => setSelectedFee(e.target.value)}>
                <option value="">Choose...</option>
                {fees.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (${f.amount})</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleApplyFees}>Apply Fees</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
