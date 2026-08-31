import React, { useState } from 'react';
import api from '../api';

export default function MembersBulkImport({ reload }) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImport = async () => {
    if (!importData.trim()) return alert('Paste member data first!');

    const lines = importData.trim().split('\n');
    if (lines.length < 2) return alert('Need at least a header and 1 member');

    // Parse header
    const header = lines[0].split('|').map(h => h.trim().toLowerCase());
    const nameIndex = header.indexOf('name');
    const emailIndex = header.indexOf('email');
    const gradeIndex = header.indexOf('grade');
    const affiliatedIndex = header.indexOf('affiliated');

    if (nameIndex === -1 || emailIndex === -1) {
      return alert('Header must include: Name, Email (and optionally Grade, Affiliated)');
    }

    const membersToAdd = [];
    const errors = [];

    // Parse members
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('|').map(p => p.trim());
      if (parts.length < 2) continue;

      const name = parts[nameIndex];
      const email = parts[emailIndex];
      const grade = gradeIndex !== -1 ? parts[gradeIndex] : '';
      const affiliated = affiliatedIndex !== -1 
        ? parts[affiliatedIndex].toLowerCase() === 'yes' || parts[affiliatedIndex].toLowerCase() === 'true'
        : false;

      if (!name || !email) {
        errors.push(`Row ${i + 1}: Missing name or email`);
        continue;
      }

      membersToAdd.push({
        name,
        email,
        grade,
        ctePathway: affiliated,
        phone: '',
        roles: [],
        committees: [],
        notes: 'Imported via bulk upload'
      });
    }

    if (membersToAdd.length === 0) {
      return alert('No valid members to import');
    }

    if (errors.length > 0) {
      const proceed = window.confirm(
        `Found ${errors.length} error(s):\n${errors.slice(0, 3).join('\n')}\n\nStill import ${membersToAdd.length} valid members?`
      );
      if (!proceed) return;
    }

    setImporting(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (let member of membersToAdd) {
        try {
          await api.post('/members', member);
          successCount++;
        } catch (err) {
          failCount++;
        }
      }

      setImportResult({
        success: successCount,
        failed: failCount,
        total: membersToAdd.length
      });

      if (successCount > 0) {
        setTimeout(() => {
          reload();
          setShowImportModal(false);
          setImportData('');
          setImportResult(null);
        }, 2000);
      }
    } catch (err) {
      alert('Error importing members: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <button 
        className="btn btn-primary"
        onClick={() => setShowImportModal(true)}
        style={{ marginLeft: '10px' }}
      >
        📥 Bulk Import Members
      </button>

      {showImportModal && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="modal-title">Bulk Import Members</h2>

            {importResult ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                  {importResult.failed === 0 ? '✅' : '⚠️'}
                </div>
                <h3 style={{ color: '#2d5a3d', marginBottom: '10px' }}>
                  Import Complete!
                </h3>
                <p style={{ color: '#8b8580', marginBottom: '20px' }}>
                  <strong style={{ color: '#2d5a3d' }}>{importResult.success}</strong> members added successfully
                </p>
                {importResult.failed > 0 && (
                  <p style={{ color: '#d4a574' }}>
                    <strong>{importResult.failed}</strong> members failed
                  </p>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                    setImportData('');
                  }}
                  style={{ marginTop: '20px' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f3f0', borderRadius: '6px' }}>
                  <p style={{ fontSize: '13px', color: '#8b8580', marginBottom: '10px', fontWeight: '600' }}>
                    FORMAT (pipe-delimited):
                  </p>
                  <code style={{ 
                    display: 'block', 
                    padding: '10px', 
                    background: '#fff', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflowX: 'auto',
                    color: '#2d5a3d'
                  }}>
                    Name|Email|Grade|Affiliated
                    <br />
                    John Doe|john@example.com|10|Yes
                    <br />
                    Jane Smith|jane@example.com|11|No
                  </code>
                  <p style={{ fontSize: '12px', color: '#8b8580', marginTop: '10px' }}>
                    ✓ Required: Name, Email<br />
                    ✓ Optional: Grade, Affiliated (Yes/No or True/False)<br />
                    ✓ Copy from: Google Forms → Export to CSV → Paste here
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Paste Member Data</label>
                  <textarea
                    className="form-input"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder={`Name|Email|Grade|Affiliated\nSaatvic Mahesh|saatvicmahesh@gmail.com|10|Yes\nAnother Student|another@gmail.com|11|No`}
                    style={{ 
                      minHeight: '300px', 
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ 
                  padding: '10px', 
                  background: '#e8f4f0', 
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#2d5a3d'
                }}>
                  📊 Ready to import{' '}
                  <strong>
                    {importData.trim().split('\n').filter(line => line.trim()).length - 1}
                  </strong>
                  {' '}members
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowImportModal(false);
                      setImportData('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleImport}
                    disabled={importing}
                  >
                    {importing ? 'Importing...' : '📥 Import Members'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
