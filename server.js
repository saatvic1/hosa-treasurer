const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hosa-treasurer-default-rtdb.firebaseio.com'
});

const db = admin.database();
const app = express();
const SECRET = 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// ===== MIDDLEWARE =====
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== AUTH =====
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const snapshot = await db.ref('users').once('value');
    let user = null;
    snapshot.forEach(child => {
      if (child.val().email === email && child.val().password === password) {
        user = { id: child.key, ...child.val() };
      }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const snapshot = await db.ref('users').once('value');
    let exists = false;
    snapshot.forEach(child => {
      if (child.val().email === email) exists = true;
    });
    if (exists) return res.status(400).json({ error: 'Email exists' });
    
    const newId = Date.now().toString();
    await db.ref(`users/${newId}`).set({ id: newId, email, password, name, role: 'member' });
    const token = jwt.sign({ id: newId, role: 'member' }, SECRET);
    res.json({ token, user: { id: newId, name, email, role: 'member' } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== MEMBERS =====
app.get('/api/members', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('members').once('value');
    const members = [];
    snapshot.forEach(child => {
      members.push({ id: child.key, ...child.val() });
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching members' });
  }
});

app.post('/api/members', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`members/${newId}`).set({ id: newId, ...req.body });
    res.json({ id: newId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error creating member' });
  }
});

app.patch('/api/members/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`members/${req.params.id}`).update(req.body);
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error updating member' });
  }
});

app.delete('/api/members/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`members/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting member' });
  }
});

// ===== COMMITTEES =====
app.get('/api/committees', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('committees').once('value');
    const committees = [];
    snapshot.forEach(child => {
      committees.push({ id: child.key, ...child.val() });
    });
    res.json(committees);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching committees' });
  }
});

app.post('/api/committees', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`committees/${newId}`).set({ id: newId, ...req.body });
    res.json({ id: newId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error creating committee' });
  }
});

app.patch('/api/committees/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`committees/${req.params.id}`).update(req.body);
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error updating committee' });
  }
});

app.delete('/api/committees/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`committees/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting committee' });
  }
});

// ===== COMMITTEE MEMBERS =====
app.get('/api/committees/:id/members', verifyToken, async (req, res) => {
  try {
    const membersSnapshot = await db.ref('members').once('value');
    const commMembersSnapshot = await db.ref('committeeMembers').once('value');
    
    const members = {};
    membersSnapshot.forEach(child => {
      members[child.key] = child.val();
    });
    
    const commMembers = [];
    commMembersSnapshot.forEach(child => {
      if (child.val().committeeId === req.params.id) {
        const member = members[child.val().memberId];
        commMembers.push({
          ...child.val(),
          memberName: member?.name || 'Unknown',
          memberEmail: member?.email || ''
        });
      }
    });
    res.json(commMembers);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching committee members' });
  }
});

app.post('/api/committees/:id/members', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`committeeMembers/${newId}`).set({
      id: newId,
      committeeId: req.params.id,
      memberId: req.body.memberId,
      addedDate: new Date().toISOString()
    });
    res.json({ id: newId, committeeId: req.params.id, memberId: req.body.memberId });
  } catch (err) {
    res.status(500).json({ error: 'Error adding member' });
  }
});

app.delete('/api/committees/:committeeId/members/:memberId', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('committeeMembers').once('value');
    snapshot.forEach(child => {
      if (child.val().committeeId === req.params.committeeId && child.key === req.params.memberId) {
        db.ref(`committeeMembers/${child.key}`).remove();
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error removing member' });
  }
});

// ===== WEEKLY NOTES =====
app.get('/api/committees/:id/weekly-notes', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('weeklyNotes').once('value');
    const notes = [];
    snapshot.forEach(child => {
      if (child.val().committeeId === req.params.id) {
        notes.push({ id: child.key, ...child.val() });
      }
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching notes' });
  }
});

app.post('/api/committees/:id/weekly-notes', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`weeklyNotes/${newId}`).set({
      id: newId,
      committeeId: req.params.id,
      week: req.body.week,
      content: req.body.content,
      createdBy: req.user.id,
      createdDate: new Date().toISOString()
    });
    res.json({ id: newId });
  } catch (err) {
    res.status(500).json({ error: 'Error creating note' });
  }
});

app.patch('/api/weekly-notes/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`weeklyNotes/${req.params.id}`).update({ content: req.body.content });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error updating note' });
  }
});

app.delete('/api/weekly-notes/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`weeklyNotes/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting note' });
  }
});

// ===== SLC POINTS (Weekly 0-3) =====
app.post('/api/committees/:id/slc-points', verifyToken, async (req, res) => {
  try {
    const { memberId, week, rating } = req.body;
    const newId = Date.now().toString();
    
    await db.ref(`slcPointsTracking/${newId}`).set({
      id: newId,
      committeeId: req.params.id,
      memberId: memberId,
      week: week,
      rating: rating,
      ratedBy: req.user.id,
      ratedDate: new Date().toISOString()
    });
    
    await db.ref(`slcPointsHistory/${newId}`).set({
      id: newId,
      memberId: memberId,
      points: parseInt(rating),
      reason: `Week ${week} Committee Participation (${rating}/3)`,
      awardedBy: req.user.id,
      awardedDate: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error assigning points' });
  }
});

// ===== SLC POINTS (General Award) =====
app.post('/api/slc-points', verifyToken, async (req, res) => {
  if (req.user.role !== 'mega-admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    const newId = Date.now().toString();
    await db.ref(`slcPointsHistory/${newId}`).set({
      id: newId,
      memberId: req.body.memberId,
      points: parseInt(req.body.points),
      reason: req.body.reason || 'Award',
      awardedBy: req.user.id,
      awardedDate: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error awarding points' });
  }
});

app.get('/api/slc-points-all', verifyToken, async (req, res) => {
  try {
    const historySnapshot = await db.ref('slcPointsHistory').once('value');
    const membersSnapshot = await db.ref('members').once('value');
    
    const members = {};
    membersSnapshot.forEach(child => {
      members[child.key] = child.val();
    });
    
    const detailed = [];
    const totals = {};
    
    historySnapshot.forEach(child => {
      const entry = child.val();
      if (!totals[entry.memberId]) totals[entry.memberId] = 0;
      totals[entry.memberId] += entry.points;
      
      detailed.push({
        ...entry,
        memberName: members[entry.memberId]?.name || 'Unknown',
        memberRunningTotal: totals[entry.memberId]
      });
    });
    
    res.json(detailed);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching points' });
  }
});

// ===== OTHER ENDPOINTS (Minimal for now) =====
app.get('/api/attendance', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('attendance').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('transactions').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.post('/api/transactions', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`transactions/${newId}`).set({ id: newId, ...req.body });
    res.json({ id: newId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

app.get('/api/buckets', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('buckets').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data || []);
  } catch {
    res.json([{ id: '1', name: 'General Fund', balance: 5000, budget: 10000 }]);
  }
});

app.post('/api/buckets', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`buckets/${newId}`).set({ id: newId, ...req.body });
    res.json({ id: newId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error creating bucket' });
  }
});

app.patch('/api/buckets/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`buckets/${req.params.id}`).update(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error updating bucket' });
  }
});

app.get('/api/fee-categories', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('feeCategories').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data || []);
  } catch {
    res.json([]);
  }
});

app.post('/api/fee-categories', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`feeCategories/${newId}`).set({ id: newId, ...req.body });
    res.json({ id: newId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error creating fee' });
  }
});

app.get('/api/member-fees', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('memberFees').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.get('/api/fundraisers', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('fundraisers').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.post('/api/fundraisers', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`fundraisers/${newId}`).set({ id: newId, ...req.body });
    res.json({ id: newId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error creating fundraiser' });
  }
});

app.get('/api/snap-campaigns', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('snapCampaigns').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.get('/api/grants', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('grants').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.get('/api/equipment', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('equipment').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.get('/api/equipment-logs', verifyToken, async (req, res) => res.json([]));

app.get('/api/events', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref('events').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.post('/api/events', verifyToken, async (req, res) => {
  try {
    const newId = Date.now().toString();
    await db.ref(`events/${newId}`).set({ id: newId, ...req.body });
    res.json({ id: newId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Error creating event' });
  }
});

app.get('/api/email-history', verifyToken, async (req, res) => res.json([]));

app.post('/api/email', verifyToken, async (req, res) => {
  res.json({ success: true });
});

app.get('/api/settings', verifyToken, async (req, res) => {
  res.json({ orgName: 'HOSA SLC', orgEmail: 'hosa@example.com' });
});

app.get('/api/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'mega-admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const snapshot = await db.ref('users').once('value');
    const data = [];
    snapshot.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.get('/api/member-dashboard', verifyToken, async (req, res) => {
  res.json({
    member: {},
    outstandingFees: 0,
    equipmentCount: 0,
    eventsCount: 0,
    fundraisersCount: 0
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
