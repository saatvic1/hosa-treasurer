const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const SECRET = 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// ===== FIREBASE INIT =====
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hosa-treasurer-default-rtdb.firebaseio.com'
  });
  console.log('Firebase initialized successfully');
} catch (err) {
  console.error('Firebase init error:', err.message);
  process.exit(1);
}

const db = admin.database();

// ===== LOCAL BACKUP DATA =====
const users = [
  { id: '1', email: 'mega@admin.com', password: 'megaadmin123', name: 'Mega Admin', role: 'mega-admin' },
  { id: '2', email: 'admin@hosa.com', password: 'admin123', name: 'Admin', role: 'admin' },
  { id: '3', email: 'member@hosa.com', password: 'member123', name: 'Member', role: 'member' },
];

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
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email exists' });
  const newUser = { id: Date.now().toString(), email, password, name, role: 'member' };
  users.push(newUser);
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, SECRET);
  res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

// ===== MEMBERS =====
app.get('/api/members', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('members').once('value');
    const members = snap.val() || {};
    res.json(Object.values(members));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newMember = { id, ...req.body };
    await db.ref(`members/${id}`).set(newMember);
    res.json(newMember);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/members/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`members/${req.params.id}`).update(req.body);
    const snap = await db.ref(`members/${req.params.id}`).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/members/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`members/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== FEES =====
app.get('/api/fee-categories', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('feeCategories').once('value');
    const fees = snap.val() || {};
    res.json(Object.values(fees));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fee-categories', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newFee = { id, ...req.body };
    await db.ref(`feeCategories/${id}`).set(newFee);
    res.json(newFee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/fee-categories/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`feeCategories/${req.params.id}`).update(req.body);
    const snap = await db.ref(`feeCategories/${req.params.id}`).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fee-categories/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`feeCategories/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/member-fees', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('memberFees').once('value');
    const fees = snap.val() || {};
    res.json(Object.values(fees));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/member-fees', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newMF = { id, ...req.body };
    await db.ref(`memberFees/${id}`).set(newMF);
    res.json(newMF);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/member-fees/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`memberFees/${req.params.id}`).update(req.body);
    const snap = await db.ref(`memberFees/${req.params.id}`).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== COMMITTEES =====
app.get('/api/committees', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('committees').once('value');
    const committees = snap.val() || {};
    res.json(Object.values(committees));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/committees', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newComm = { id, ...req.body };
    await db.ref(`committees/${id}`).set(newComm);
    res.json(newComm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/committees/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`committees/${req.params.id}`).update(req.body);
    const snap = await db.ref(`committees/${req.params.id}`).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/committees/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`committees/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== COMMITTEE MEMBERS =====
app.get('/api/committees/:id/members', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref(`committeeMembers/${req.params.id}`).once('value');
    const commMembers = snap.val() || {};
    
    const memberSnap = await db.ref('members').once('value');
    const members = memberSnap.val() || {};
    
    const withDetails = Object.values(commMembers).map(m => ({
      ...m,
      memberName: members[m.memberId]?.name || 'Unknown',
      memberEmail: members[m.memberId]?.email || ''
    }));
    
    res.json(withDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/committees/:id/members', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newMember = { id, committeeId: req.params.id, ...req.body };
    await db.ref(`committeeMembers/${req.params.id}/${id}`).set(newMember);
    res.json(newMember);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/committees/:committeeId/members/:memberId', verifyToken, async (req, res) => {
  try {
    await db.ref(`committeeMembers/${req.params.committeeId}/${req.params.memberId}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== WEEKLY NOTES =====
app.get('/api/committees/:id/weekly-notes', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref(`weeklyNotes/${req.params.id}`).once('value');
    const notes = snap.val() || {};
    res.json(Object.values(notes));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/committees/:id/weekly-notes', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newNote = { id, committeeId: req.params.id, createdBy: req.user.id, createdDate: new Date().toISOString(), ...req.body };
    await db.ref(`weeklyNotes/${req.params.id}/${id}`).set(newNote);
    res.json(newNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/weekly-notes/:id', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref(`weeklyNotes`).orderByChild('id').equalTo(req.params.id).once('value');
    const data = snap.val();
    if (data) {
      const key = Object.keys(data)[0];
      await db.ref(`weeklyNotes/${key}`).update(req.body);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/weekly-notes/:id', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref(`weeklyNotes`).orderByChild('id').equalTo(req.params.id).once('value');
    const data = snap.val();
    if (data) {
      const key = Object.keys(data)[0];
      await db.ref(`weeklyNotes/${key}`).remove();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SLC POINTS =====
app.post('/api/committees/:id/slc-points', verifyToken, async (req, res) => {
  try {
    const { memberId, week, rating } = req.body;
    const historyId = Date.now().toString();
    
    const pointEntry = {
      id: historyId,
      memberId: memberId,
      points: parseInt(rating),
      reason: `Week ${week} Committee Participation (${rating}/3)`,
      awardedBy: req.user.id,
      awardedDate: new Date().toISOString()
    };
    
    await db.ref(`slcPointsHistory/${historyId}`).set(pointEntry);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/slc-points', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('slcPointsHistory').once('value');
    const points = snap.val() || {};
    res.json(Object.values(points));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/slc-points', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'mega-admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { memberId, points, reason } = req.body;
    const id = Date.now().toString();
    const newEntry = {
      id,
      memberId,
      points: parseInt(points),
      reason: reason || 'Award',
      awardedBy: req.user.id,
      awardedDate: new Date().toISOString()
    };
    
    await db.ref(`slcPointsHistory/${id}`).set(newEntry);
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/slc-points-all', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('slcPointsHistory').once('value');
    const points = snap.val() || {};
    
    const memberSnap = await db.ref('members').once('value');
    const members = memberSnap.val() || {};
    
    const detailed = Object.values(points).map(p => {
      const totalPoints = Object.values(points)
        .filter(h => h.memberId === p.memberId)
        .reduce((sum, h) => sum + (h.points || 0), 0);
      
      return {
        ...p,
        memberName: members[p.memberId]?.name || 'Unknown',
        memberRunningTotal: totalPoints
      };
    });
    
    res.json(detailed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== EMAIL & INVOICES =====
app.post('/api/email', verifyToken, async (req, res) => {
  try {
    const { to, subject, body, type } = req.body;
    const id = Date.now().toString();
    const newEmail = {
      id,
      to: Array.isArray(to) ? to : [to],
      subject,
      body,
      type,
      sentAt: new Date().toISOString(),
      recipientCount: Array.isArray(to) ? to.length : 1
    };
    await db.ref(`emailHistory/${id}`).set(newEmail);
    res.json({ success: true, emailId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/email-history', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('emailHistory').once('value');
    const history = snap.val() || {};
    res.json(Object.values(history));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== OTHER ENDPOINTS =====
app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('transactions').once('value');
    const tx = snap.val() || {};
    res.json(Object.values(tx));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newTx = { id, ...req.body };
    await db.ref(`transactions/${id}`).set(newTx);
    res.json(newTx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/transactions/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`transactions/${req.params.id}`).update(req.body);
    const snap = await db.ref(`transactions/${req.params.id}`).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`transactions/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/buckets', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('buckets').once('value');
    const buckets = snap.val() || {};
    res.json(Object.values(buckets));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/buckets', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newBucket = { id, ...req.body };
    await db.ref(`buckets/${id}`).set(newBucket);
    res.json(newBucket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/buckets/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`buckets/${req.params.id}`).update(req.body);
    const snap = await db.ref(`buckets/${req.params.id}`).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/buckets/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`buckets/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fundraisers', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('fundraisers').once('value');
    const fund = snap.val() || {};
    res.json(Object.values(fund));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fundraisers', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newFund = { id, ...req.body };
    await db.ref(`fundraisers/${id}`).set(newFund);
    res.json(newFund);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/fundraisers/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`fundraisers/${req.params.id}`).update(req.body);
    const snap = await db.ref(`fundraisers/${req.params.id}`).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fundraisers/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`fundraisers/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events', verifyToken, async (req, res) => {
  try {
    const snap = await db.ref('events').once('value');
    const events = snap.val() || {};
    res.json(Object.values(events));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', verifyToken, async (req, res) => {
  try {
    const id = Date.now().toString();
    const newEvent = { id, ...req.body };
    await db.ref(`events/${id}`).set(newEvent);
    res.json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/events/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`events/${req.params.id}`).update(req.body);
    const snap = await db.ref(`events/${req.params.id}`).once('value');
    res.json(snap.val());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', verifyToken, async (req, res) => {
  try {
    await db.ref(`events/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
