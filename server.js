const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();
const SECRET = 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// ===== DATA =====
const users = [
  { id: '1', email: 'mega@admin.com', password: 'megaadmin123', name: 'Mega Admin', role: 'mega-admin' },
  { id: '2', email: 'admin@hosa.com', password: 'admin123', name: 'Admin', role: 'admin' },
  { id: '3', email: 'member@hosa.com', password: 'member123', name: 'Member', role: 'member' },
];

const members = [];
const committees = [];
const committeeMembers = [];
const weeklyNotes = [];
const slcPointsHistory = [];
const emailHistory = [];
const feeCategories = [];
const memberFees = [];
const transactions = [];
const buckets = [];
const fundraisers = [];
const events = [];
const attendance = [];

// ===== UTILITY FUNCTIONS =====
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

// ===== USERS MANAGEMENT =====
app.get('/api/users', verifyToken, (req, res) => {
  if (req.user.role !== 'mega-admin') return res.status(403).json({ error: 'Forbidden' });
  // Don't send passwords to frontend
  const safeUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role
  }));
  res.json(safeUsers);
});

app.post('/api/users', verifyToken, (req, res) => {
  if (req.user.role !== 'mega-admin') return res.status(403).json({ error: 'Forbidden' });
  const { email, password, name, role } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email exists' });
  const newUser = { id: Date.now().toString(), email, password, name, role: role || 'member' };
  users.push(newUser);
  res.json(newUser);
});

app.patch('/api/users/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'mega-admin') return res.status(403).json({ error: 'Forbidden' });
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  Object.assign(user, req.body);
  res.json(user);
});

app.delete('/api/users/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'mega-admin') return res.status(403).json({ error: 'Forbidden' });
  const index = users.findIndex(u => u.id === req.params.id);
  if (index > -1) users.splice(index, 1);
  res.json({ success: true });
});

// ===== MEMBERS =====
app.get('/api/members', verifyToken, (req, res) => res.json(members));

app.post('/api/members', verifyToken, (req, res) => {
  try {
    const { name, email, phone, grade, ctePathway, roles, committees, notes } = req.body;
    
    // Create member
    const newMember = { 
      id: Date.now().toString(), 
      name, 
      email, 
      phone: phone || '', 
      grade: grade || '', 
      ctePathway: ctePathway || false, 
      roles: roles || [], 
      committees: committees || [], 
      notes: notes || '' 
    };
    members.push(newMember);
    
    // AUTO-CREATE USER ACCOUNT
    if (!users.find(u => u.email === email)) {
      const generatedPassword = generateRandomPassword();
      const newUser = {
        id: Date.now().toString() + '_user',
        email: email,
        password: generatedPassword,
        name: name,
        role: 'member' // Default role
      };
      users.push(newUser);
      
      // RETURN BOTH member AND the auto-created user credentials
      res.json({
        member: newMember,
        autoCreatedUser: {
          email: newUser.email,
          password: generatedPassword,
          role: newUser.role,
          message: `✅ User account created! Share this password with ${name}`
        }
      });
    } else {
      res.json({
        member: newMember,
        autoCreatedUser: null,
        message: `User already exists for ${email}`
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/members/:id', verifyToken, (req, res) => {
  const member = members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });
  Object.assign(member, req.body);
  res.json(member);
});

app.delete('/api/members/:id', verifyToken, (req, res) => {
  const index = members.findIndex(m => m.id === req.params.id);
  if (index > -1) members.splice(index, 1);
  res.json({ success: true });
});

// ===== FEES =====
app.get('/api/fee-categories', verifyToken, (req, res) => res.json(feeCategories));
app.post('/api/fee-categories', verifyToken, (req, res) => {
  const newFee = { id: Date.now().toString(), ...req.body };
  feeCategories.push(newFee);
  res.json(newFee);
});
app.patch('/api/fee-categories/:id', verifyToken, (req, res) => {
  const fee = feeCategories.find(f => f.id === req.params.id);
  if (!fee) return res.status(404).json({ error: 'Not found' });
  Object.assign(fee, req.body);
  res.json(fee);
});
app.delete('/api/fee-categories/:id', verifyToken, (req, res) => {
  const index = feeCategories.findIndex(f => f.id === req.params.id);
  if (index > -1) feeCategories.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/member-fees', verifyToken, (req, res) => res.json(memberFees));
app.post('/api/member-fees', verifyToken, (req, res) => {
  const newMF = { id: Date.now().toString(), ...req.body };
  memberFees.push(newMF);
  res.json(newMF);
});
app.patch('/api/member-fees/:id', verifyToken, (req, res) => {
  const mf = memberFees.find(m => m.id === req.params.id);
  if (!mf) return res.status(404).json({ error: 'Not found' });
  Object.assign(mf, req.body);
  res.json(mf);
});

// ===== COMMITTEES =====
app.get('/api/committees', verifyToken, (req, res) => res.json(committees));
app.post('/api/committees', verifyToken, (req, res) => {
  const newComm = { id: Date.now().toString(), ...req.body };
  committees.push(newComm);
  res.json(newComm);
});
app.patch('/api/committees/:id', verifyToken, (req, res) => {
  const comm = committees.find(c => c.id === req.params.id);
  if (!comm) return res.status(404).json({ error: 'Not found' });
  Object.assign(comm, req.body);
  res.json(comm);
});
app.delete('/api/committees/:id', verifyToken, (req, res) => {
  const index = committees.findIndex(c => c.id === req.params.id);
  if (index > -1) committees.splice(index, 1);
  res.json({ success: true });
});

// ===== COMMITTEE MEMBERS =====
app.get('/api/committees/:id/members', verifyToken, (req, res) => {
  const { id } = req.params;
  const commMembers = committeeMembers.filter(m => m.committeeId === id);
  const withDetails = commMembers.map(m => {
    const member = members.find(mem => mem.id === m.memberId);
    return { ...m, memberName: member?.name || 'Unknown', memberEmail: member?.email || '' };
  });
  res.json(withDetails);
});

app.post('/api/committees/:id/members', verifyToken, (req, res) => {
  const { id } = req.params;
  const { memberId } = req.body;
  const newMember = {
    id: Date.now().toString(),
    committeeId: id,
    memberId: memberId,
    addedDate: new Date().toISOString()
  };
  committeeMembers.push(newMember);
  res.json(newMember);
});

app.delete('/api/committees/:committeeId/members/:memberId', verifyToken, (req, res) => {
  const { committeeId, memberId } = req.params;
  const index = committeeMembers.findIndex(m => m.committeeId === committeeId && m.id === memberId);
  if (index > -1) committeeMembers.splice(index, 1);
  res.json({ success: true });
});

// ===== WEEKLY NOTES =====
app.get('/api/committees/:id/weekly-notes', verifyToken, (req, res) => {
  const { id } = req.params;
  const notes = weeklyNotes.filter(n => n.committeeId === id);
  res.json(notes);
});

app.post('/api/committees/:id/weekly-notes', verifyToken, (req, res) => {
  const { id } = req.params;
  const { week, content } = req.body;
  const newNote = {
    id: Date.now().toString(),
    committeeId: id,
    week: week,
    content: content,
    createdBy: req.user.id,
    createdDate: new Date().toISOString()
  };
  weeklyNotes.push(newNote);
  res.json(newNote);
});

app.patch('/api/weekly-notes/:id', verifyToken, (req, res) => {
  const note = weeklyNotes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });
  note.content = req.body.content || note.content;
  res.json(note);
});

app.delete('/api/weekly-notes/:id', verifyToken, (req, res) => {
  const index = weeklyNotes.findIndex(n => n.id === req.params.id);
  if (index > -1) weeklyNotes.splice(index, 1);
  res.json({ success: true });
});

// ===== SLC POINTS =====
app.post('/api/committees/:id/slc-points', verifyToken, (req, res) => {
  try {
    const { memberId, week, rating } = req.body;
    const pointEntry = {
      id: Date.now().toString(),
      memberId: memberId,
      points: parseInt(rating),
      reason: `Week ${week} Committee Participation (${rating}/3)`,
      awardedBy: req.user.id,
      awardedDate: new Date().toISOString()
    };
    slcPointsHistory.push(pointEntry);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/slc-points', verifyToken, (req, res) => res.json(slcPointsHistory));

app.post('/api/slc-points', verifyToken, (req, res) => {
  if (req.user.role !== 'mega-admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { memberId, points, reason } = req.body;
  const newEntry = {
    id: Date.now().toString(),
    memberId: memberId,
    points: parseInt(points),
    reason: reason || 'Award',
    awardedBy: req.user.id,
    awardedDate: new Date().toISOString()
  };
  slcPointsHistory.push(newEntry);
  res.json(newEntry);
});

app.get('/api/slc-points-all', verifyToken, (req, res) => {
  const detailed = slcPointsHistory.map(p => {
    const member = members.find(m => m.id === p.memberId);
    const totalPoints = slcPointsHistory
      .filter(h => h.memberId === p.memberId)
      .reduce((sum, h) => sum + h.points, 0);
    return {
      ...p,
      memberName: member?.name || 'Unknown',
      memberRunningTotal: totalPoints
    };
  });
  res.json(detailed);
});

// ===== EMAIL =====
app.post('/api/email', verifyToken, (req, res) => {
  const { to, subject, body, type } = req.body;
  const newEmail = {
    id: Date.now().toString(),
    to: Array.isArray(to) ? to : [to],
    subject,
    body,
    type,
    sentAt: new Date().toISOString(),
    recipientCount: Array.isArray(to) ? to.length : 1
  };
  emailHistory.push(newEmail);
  res.json({ success: true, emailId: newEmail.id });
});

app.get('/api/email-history', verifyToken, (req, res) => res.json(emailHistory));

// ===== OTHER ENDPOINTS =====
app.get('/api/attendance', verifyToken, (req, res) => res.json(attendance));
app.get('/api/transactions', verifyToken, (req, res) => res.json(transactions));
app.post('/api/transactions', verifyToken, (req, res) => {
  const newTx = { id: Date.now().toString(), ...req.body };
  transactions.push(newTx);
  res.json(newTx);
});
app.patch('/api/transactions/:id', verifyToken, (req, res) => {
  const tx = transactions.find(t => t.id === req.params.id);
  if (!tx) return res.status(404).json({ error: 'Not found' });
  Object.assign(tx, req.body);
  res.json(tx);
});
app.delete('/api/transactions/:id', verifyToken, (req, res) => {
  const index = transactions.findIndex(t => t.id === req.params.id);
  if (index > -1) transactions.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/buckets', verifyToken, (req, res) => res.json(buckets));
app.post('/api/buckets', verifyToken, (req, res) => {
  const newBucket = { id: Date.now().toString(), ...req.body };
  buckets.push(newBucket);
  res.json(newBucket);
});
app.patch('/api/buckets/:id', verifyToken, (req, res) => {
  const bucket = buckets.find(b => b.id === req.params.id);
  if (!bucket) return res.status(404).json({ error: 'Not found' });
  Object.assign(bucket, req.body);
  res.json(bucket);
});
app.delete('/api/buckets/:id', verifyToken, (req, res) => {
  const index = buckets.findIndex(b => b.id === req.params.id);
  if (index > -1) buckets.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/fundraisers', verifyToken, (req, res) => res.json(fundraisers));
app.post('/api/fundraisers', verifyToken, (req, res) => {
  const newFund = { id: Date.now().toString(), ...req.body };
  fundraisers.push(newFund);
  res.json(newFund);
});
app.patch('/api/fundraisers/:id', verifyToken, (req, res) => {
  const fund = fundraisers.find(f => f.id === req.params.id);
  if (!fund) return res.status(404).json({ error: 'Not found' });
  Object.assign(fund, req.body);
  res.json(fund);
});
app.delete('/api/fundraisers/:id', verifyToken, (req, res) => {
  const index = fundraisers.findIndex(f => f.id === req.params.id);
  if (index > -1) fundraisers.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/events', verifyToken, (req, res) => res.json(events));
app.post('/api/events', verifyToken, (req, res) => {
  const newEvent = { id: Date.now().toString(), ...req.body };
  events.push(newEvent);
  res.json(newEvent);
});
app.patch('/api/events/:id', verifyToken, (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });
  Object.assign(event, req.body);
  res.json(event);
});
app.delete('/api/events/:id', verifyToken, (req, res) => {
  const index = events.findIndex(e => e.id === req.params.id);
  if (index > -1) events.splice(index, 1);
  res.json({ success: true });
});

// ===== CATCH ALL =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
