import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export default function Settings({ user, data, reload }) {
  const [settings, setSettings] = useState({
    orgName: 'HOSA SLC',
    orgEmail: 'hosa@example.com',
    attendancePoints: 10,
    eventAttendancePoints: 5,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setSettings({ ...settings, ...res.data });
      }
    } catch (err) {
      console.error('Error loading settings');
    }
  };
  loadSettings();
}, [settings]);

  const handleSave = async () => {
    try {
      await api.post('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error saving settings');
    }
  };

  return (
    <div>
      <h2 className="card-title-main">Settings</h2>

      <div className="card">
        <div className="card-title">Organization Settings</div>
        
        {saved && <div style={{ background: '#e8f4f0', color: '#2d5a3d', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>✓ Settings saved!</div>}

        <div className="form-group">
          <label className="form-label">Organization Name</label>
          <input className="form-input" value={settings.orgName} onChange={(e) => setSettings({ ...settings, orgName: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Organization Email</label>
          <input className="form-input" type="email" value={settings.orgEmail} onChange={(e) => setSettings({ ...settings, orgEmail: e.target.value })} />
        </div>

        <div className="card-title" style={{ marginTop: '32px', marginBottom: '16px' }}>SLC Points Configuration</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Attendance Points</label>
            <input className="form-input" type="number" value={settings.attendancePoints} onChange={(e) => setSettings({ ...settings, attendancePoints: parseInt(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Event Attendance Points</label>
            <input className="form-input" type="number" value={settings.eventAttendancePoints} onChange={(e) => setSettings({ ...settings, eventAttendancePoints: parseInt(e.target.value) })} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: '24px' }}>
          💾 Save Settings
        </button>
      </div>

      <div className="card" style={{ marginTop: '20px', borderColor: '#f5e3e3' }}>
        <div className="card-title" style={{ color: '#b84c4c' }}>Danger Zone</div>
        <p style={{ fontSize: '13px', color: '#8b8580', marginBottom: '16px' }}>These actions are irreversible.</p>
        <button className="btn btn-danger" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          ⚠️ Clear All Data (Disabled)
        </button>
      </div>
    </div>
  );
}
