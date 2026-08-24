const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const JWT_SECRET = 'hosa-enterprise-2024';

let store = {
  users: [
    { id: '1', email: 'mega@admin.com', password: 'megaadmin123', name: 'Mega Admin', role: 'mega-admin' },
    { id: '2', email: 'admin@hosa.com', password: 'admin123', name: 'HOSA Admin', role: 'admin' },
    { id: '3', email: 'member@hosa.com', password: 'member123', name: 'John Member', role: 'member' },
  ],
  members: [
    { id: '1', name: 'John Smith', email: 'john@example.com', phone: '555-1234', grade: '12', status: 'active', joinDate: '2025-01-15', notes: '', userId: '3' },
  ],
  committees: [],
  committeeMembers: [],
  attendance: [],
  slcPoints: [],
  transactions: [],
  buckets: [{ id: '1', name: 'General Fund', balance: 0, description: 'Main operating fund' }],
  bucketTransactions: [],
  feeCats: [{ id: '1', name: 'Membership Dues', amount: 50 }],
  memberFees: [],
  memberFeePayments: [],
  fundraisers: [],
  snapCampaigns: [],
  grants: [],
  equipment: [{ id: '1', name: 'Full Suit #1', type: 'Suit', condition: 'Good', value: 75, notes: '' }],
  equipmentLogs: [],
  events: [],
  emailHistory: [],
  settings: { chapterName: 'HOSA Chapter', treasurer: 'Treasurer Name', email: 'treasurer@hosa.com', phone: '555-0000' },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (!['admin', 'mega-admin', 'committee-lead'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
};

const megaOnly = (req, res, next) => {
  if (req.user?.role !== 'mega-admin') {
    return res.status(403).json({ error: 'Mega admin only' });
  }
  next();
};

// ===== AUTH =====
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = store.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (store.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email exists' });
  const newUser = { id: uid(), email, password, name, role: 'member' };
  store.users.push(newUser);
  const newMember = { id: uid(), name, email, phone: '', grade: '', status: 'active', joinDate: new Date().toISOString().split('T')[0], notes: '', userId: newUser.id };
  store.members.push(newMember);
  const token = jwt.sign({ id: newUser.id, email, role: 'member', name }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: newUser.id, email, role: 'member', name } });
});

app.patch('/api/auth/password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = store.users.find(u => u.id === req.user.id);
  if (!user || user.password !== currentPassword) return res.status(400).json({ error: 'Invalid password' });
  user.password = newPassword;
  res.json({ message: 'Password updated' });
});

// ===== USER MANAGEMENT =====
app.get('/api/users', auth, megaOnly, (req, res) => {
  res.json(store.users.map(u => ({ id: u.id, email: u.email, name: u.name, password: u.password, role: u.role })));
});

app.post('/api/users', auth, megaOnly, (req, res) => {
  const { email, password, name, role } = req.body;
  if (store.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email exists' });
  const newUser = { id: uid(), email, password, name, role: role || 'member' };
  store.users.push(newUser);
  res.json(newUser);
});

app.patch('/api/users/:id', auth, megaOnly, (req, res) => {
  const user = store.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  Object.assign(user, req.body);
  res.json(user);
});

app.delete('/api/users/:id', auth, megaOnly, (req, res) => {
  store.users = store.users.filter(u => u.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== MEMBERS =====
app.get('/api/members', auth, (req, res) => {
  if (req.user.role === 'member') {
    const member = store.members.find(m => m.email === req.user.email);
    return res.json(member ? [member] : []);
  }
  res.json(store.members);
});

app.post('/api/members', auth, adminOnly, (req, res) => {
  const newMember = { id: uid(), ...req.body, joinDate: new Date().toISOString().split('T')[0] };
  store.members.push(newMember);
  res.json(newMember);
});

app.patch('/api/members/:id', auth, adminOnly, (req, res) => {
  const member = store.members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });
  Object.assign(member, req.body);
  res.json(member);
});

app.delete('/api/members/:id', auth, adminOnly, (req, res) => {
  store.members = store.members.filter(m => m.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== CSV IMPORT MEMBERS (Google Forms) =====
app.post('/api/import-members', auth, adminOnly, (req, res) => {
  const { csvData } = req.body;
  const lines = csvData.trim().split('\n');
  const imported = [];
  
  for (let line of lines) {
    if (!line.trim()) continue;
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 2) continue;
    
    const [name, email, phone, grade, notes] = parts;
    if (!store.members.find(m => m.email === email)) {
      const newMember = {
        id: uid(),
        name: name || 'Unknown',
        email: email || '',
        phone: phone || '',
        grade: grade || '',
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        notes: notes || ''
      };
      store.members.push(newMember);
      imported.push(newMember);
    }
  }
  
  res.json({ imported, count: imported.length });
});

// ===== COMMITTEES =====
app.get('/api/committees', auth, (req, res) => {
  res.json(store.committees);
});

app.post('/api/committees', auth, adminOnly, (req, res) => {
  const newCom = { id: uid(), ...req.body, createdDate: new Date().toISOString().split('T')[0] };
  store.committees.push(newCom);
  res.json(newCom);
});

app.patch('/api/committees/:id', auth, adminOnly, (req, res) => {
  const com = store.committees.find(c => c.id === req.params.id);
  if (!com) return res.status(404).json({ error: 'Not found' });
  Object.assign(com, req.body);
  res.json(com);
});

app.delete('/api/committees/:id', auth, adminOnly, (req, res) => {
  store.committees = store.committees.filter(c => c.id !== req.params.id);
  store.committeeMembers = store.committeeMembers.filter(m => m.committeeId !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== COMMITTEE MEMBERS =====
app.get('/api/committee-members/:comId', auth, (req, res) => {
  res.json(store.committeeMembers.filter(m => m.committeeId === req.params.comId));
});

app.post('/api/committee-members', auth, adminOnly, (req, res) => {
  const newMem = { id: uid(), ...req.body, assignedDate: new Date().toISOString().split('T')[0] };
  store.committeeMembers.push(newMem);
  res.json(newMem);
});

app.patch('/api/committee-members/:id', auth, adminOnly, (req, res) => {
  const mem = store.committeeMembers.find(m => m.id === req.params.id);
  if (!mem) return res.status(404).json({ error: 'Not found' });
  Object.assign(mem, req.body);
  res.json(mem);
});

app.delete('/api/committee-members/:id', auth, adminOnly, (req, res) => {
  store.committeeMembers = store.committeeMembers.filter(m => m.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== ATTENDANCE (Committee Lead can track, auto-adds SLC points) =====
app.get('/api/attendance', auth, (req, res) => {
  if (req.user.role === 'mega-admin') {
    return res.json(store.attendance);
  }
  // Committee leads see only their committee attendance
  const comMember = store.committeeMembers.find(cm => cm.userId === req.user.id);
  if (comMember) {
    return res.json(store.attendance.filter(a => a.committeeId === comMember.committeeId));
  }
  res.json([]);
});

app.post('/api/attendance', auth, adminOnly, (req, res) => {
  const { memberId, committeeId, date, points } = req.body;
  const newAttendance = { id: uid(), memberId, committeeId, date: date || new Date().toISOString().split('T')[0], points: points || 1 };
  store.attendance.push(newAttendance);
  
  // Auto-add SLC points
  const slcPoint = store.slcPoints.find(sp => sp.memberId === memberId && sp.date === newAttendance.date);
  if (!slcPoint) {
    store.slcPoints.push({
      id: uid(),
      memberId,
      committeeId,
      points: points || 1,
      date: newAttendance.date,
      source: 'attendance'
    });
  } else {
    slcPoint.points += (points || 1);
  }
  
  res.json(newAttendance);
});

app.patch('/api/attendance/:id', auth, adminOnly, (req, res) => {
  const att = store.attendance.find(a => a.id === req.params.id);
  if (!att) return res.status(404).json({ error: 'Not found' });
  Object.assign(att, req.body);
  res.json(att);
});

app.delete('/api/attendance/:id', auth, adminOnly, (req, res) => {
  store.attendance = store.attendance.filter(a => a.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== SLC POINTS (Mega Admin Only) =====
app.get('/api/slc-points', auth, megaOnly, (req, res) => {
  res.json(store.slcPoints);
});

app.post('/api/slc-points', auth, megaOnly, (req, res) => {
  const newPoint = { id: uid(), ...req.body, date: req.body.date || new Date().toISOString().split('T')[0] };
  store.slcPoints.push(newPoint);
  res.json(newPoint);
});

app.patch('/api/slc-points/:id', auth, megaOnly, (req, res) => {
  const point = store.slcPoints.find(p => p.id === req.params.id);
  if (!point) return res.status(404).json({ error: 'Not found' });
  Object.assign(point, req.body);
  res.json(point);
});

app.delete('/api/slc-points/:id', auth, megaOnly, (req, res) => {
  store.slcPoints = store.slcPoints.filter(p => p.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== TRANSACTIONS =====
app.get('/api/transactions', auth, (req, res) => {
  const sorted = [...store.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sorted);
});

app.post('/api/transactions', auth, adminOnly, (req, res) => {
  const newTxn = { id: uid(), ...req.body, date: req.body.date || new Date().toISOString().split('T')[0] };
  store.transactions.push(newTxn);
  res.json(newTxn);
});

app.patch('/api/transactions/:id', auth, adminOnly, (req, res) => {
  const txn = store.transactions.find(t => t.id === req.params.id);
  if (!txn) return res.status(404).json({ error: 'Not found' });
  Object.assign(txn, req.body);
  res.json(txn);
});

app.delete('/api/transactions/:id', auth, adminOnly, (req, res) => {
  store.transactions = store.transactions.filter(t => t.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== BUCKETS =====
app.get('/api/buckets', auth, (req, res) => {
  res.json(store.buckets);
});

app.post('/api/buckets', auth, adminOnly, (req, res) => {
  const newBucket = { id: uid(), ...req.body, balance: 0 };
  store.buckets.push(newBucket);
  res.json(newBucket);
});

app.patch('/api/buckets/:id', auth, adminOnly, (req, res) => {
  const bucket = store.buckets.find(b => b.id === req.params.id);
  if (!bucket) return res.status(404).json({ error: 'Not found' });
  Object.assign(bucket, req.body);
  res.json(bucket);
});

app.delete('/api/buckets/:id', auth, adminOnly, (req, res) => {
  store.buckets = store.buckets.filter(b => b.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== FEE CATEGORIES =====
app.get('/api/fee-categories', auth, (req, res) => {
  res.json(store.feeCats);
});

app.post('/api/fee-categories', auth, adminOnly, (req, res) => {
  const newCat = { id: uid(), ...req.body };
  store.feeCats.push(newCat);
  res.json(newCat);
});

app.patch('/api/fee-categories/:id', auth, adminOnly, (req, res) => {
  const cat = store.feeCats.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Not found' });
  Object.assign(cat, req.body);
  res.json(cat);
});

app.delete('/api/fee-categories/:id', auth, adminOnly, (req, res) => {
  store.feeCats = store.feeCats.filter(c => c.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== MEMBER FEES =====
app.get('/api/member-fees', auth, (req, res) => {
  res.json(store.memberFees);
});

app.post('/api/member-fees', auth, adminOnly, (req, res) => {
  const newFee = { id: uid(), ...req.body, assignedDate: new Date().toISOString().split('T')[0] };
  store.memberFees.push(newFee);
  res.json(newFee);
});

app.patch('/api/member-fees/:id', auth, adminOnly, (req, res) => {
  const fee = store.memberFees.find(f => f.id === req.params.id);
  if (!fee) return res.status(404).json({ error: 'Not found' });
  Object.assign(fee, req.body);
  res.json(fee);
});

app.delete('/api/member-fees/:id', auth, adminOnly, (req, res) => {
  store.memberFees = store.memberFees.filter(f => f.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== FUNDRAISERS =====
app.get('/api/fundraisers', auth, (req, res) => {
  res.json(store.fundraisers);
});

app.post('/api/fundraisers', auth, adminOnly, (req, res) => {
  const newFund = { id: uid(), ...req.body, date: req.body.date || new Date().toISOString().split('T')[0] };
  store.fundraisers.push(newFund);
  res.json(newFund);
});

app.patch('/api/fundraisers/:id', auth, adminOnly, (req, res) => {
  const fund = store.fundraisers.find(f => f.id === req.params.id);
  if (!fund) return res.status(404).json({ error: 'Not found' });
  Object.assign(fund, req.body);
  res.json(fund);
});

app.delete('/api/fundraisers/:id', auth, adminOnly, (req, res) => {
  store.fundraisers = store.fundraisers.filter(f => f.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== SNAP CAMPAIGNS =====
app.get('/api/snap-campaigns', auth, (req, res) => {
  res.json(store.snapCampaigns);
});

app.post('/api/snap-campaigns', auth, adminOnly, (req, res) => {
  const newSnap = { id: uid(), ...req.body, date: req.body.date || new Date().toISOString().split('T')[0] };
  store.snapCampaigns.push(newSnap);
  res.json(newSnap);
});

// ===== CSV IMPORT SNAP CAMPAIGNS =====
app.post('/api/import-snap', auth, adminOnly, (req, res) => {
  const { csvData, campaignName } = req.body;
  const lines = csvData.trim().split('\n');
  const imported = [];
  
  for (let line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 2) continue;
    
    const [memberName, amount] = parts;
    const newSnap = {
      id: uid(),
      campaignName: campaignName || 'SNAP Campaign',
      memberName,
      amount: parseFloat(amount) || 0,
      date: new Date().toISOString().split('T')[0]
    };
    store.snapCampaigns.push(newSnap);
    imported.push(newSnap);
  }
  
  res.json({ imported, count: imported.length });
});

app.patch('/api/snap-campaigns/:id', auth, adminOnly, (req, res) => {
  const snap = store.snapCampaigns.find(s => s.id === req.params.id);
  if (!snap) return res.status(404).json({ error: 'Not found' });
  Object.assign(snap, req.body);
  res.json(snap);
});

app.delete('/api/snap-campaigns/:id', auth, adminOnly, (req, res) => {
  store.snapCampaigns = store.snapCampaigns.filter(s => s.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== GRANTS =====
app.get('/api/grants', auth, (req, res) => {
  res.json(store.grants);
});

app.post('/api/grants', auth, adminOnly, (req, res) => {
  const newGrant = { id: uid(), ...req.body, date: req.body.date || new Date().toISOString().split('T')[0] };
  store.grants.push(newGrant);
  res.json(newGrant);
});

app.patch('/api/grants/:id', auth, adminOnly, (req, res) => {
  const grant = store.grants.find(g => g.id === req.params.id);
  if (!grant) return res.status(404).json({ error: 'Not found' });
  Object.assign(grant, req.body);
  res.json(grant);
});

app.delete('/api/grants/:id', auth, adminOnly, (req, res) => {
  store.grants = store.grants.filter(g => g.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== EQUIPMENT =====
app.get('/api/equipment', auth, (req, res) => {
  res.json(store.equipment);
});

app.post('/api/equipment', auth, adminOnly, (req, res) => {
  const newEquip = { id: uid(), ...req.body };
  store.equipment.push(newEquip);
  res.json(newEquip);
});

app.patch('/api/equipment/:id', auth, adminOnly, (req, res) => {
  const equip = store.equipment.find(e => e.id === req.params.id);
  if (!equip) return res.status(404).json({ error: 'Not found' });
  Object.assign(equip, req.body);
  res.json(equip);
});

app.delete('/api/equipment/:id', auth, adminOnly, (req, res) => {
  store.equipment = store.equipment.filter(e => e.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== EQUIPMENT LOGS =====
app.get('/api/equipment-logs', auth, (req, res) => {
  res.json(store.equipmentLogs);
});

app.post('/api/equipment-logs', auth, adminOnly, (req, res) => {
  const newLog = { id: uid(), ...req.body, date: new Date().toISOString().split('T')[0] };
  store.equipmentLogs.push(newLog);
  res.json(newLog);
});

app.patch('/api/equipment-logs/:id', auth, adminOnly, (req, res) => {
  const log = store.equipmentLogs.find(l => l.id === req.params.id);
  if (!log) return res.status(404).json({ error: 'Not found' });
  Object.assign(log, req.body);
  res.json(log);
});

app.delete('/api/equipment-logs/:id', auth, adminOnly, (req, res) => {
  store.equipmentLogs = store.equipmentLogs.filter(l => l.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== EVENTS =====
app.get('/api/events', auth, (req, res) => {
  res.json(store.events);
});

app.post('/api/events', auth, adminOnly, (req, res) => {
  const newEvent = { id: uid(), ...req.body, date: req.body.date || new Date().toISOString().split('T')[0] };
  store.events.push(newEvent);
  res.json(newEvent);
});

app.patch('/api/events/:id', auth, adminOnly, (req, res) => {
  const event = store.events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });
  Object.assign(event, req.body);
  res.json(event);
});

app.delete('/api/events/:id', auth, adminOnly, (req, res) => {
  store.events = store.events.filter(e => e.id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ===== EMAIL =====
app.get('/api/email-history', auth, (req, res) => {
  if (req.user.role !== 'mega-admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  res.json(store.emailHistory);
});

app.post('/api/email/send', auth, (req, res) => {
  if (req.user.role !== 'mega-admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const { to, subject, body } = req.body;
  store.emailHistory.push({ id: uid(), to, subject, sentDate: new Date().toISOString(), status: 'sent' });
  res.json({ message: 'Email sent' });
});

// ===== SETTINGS =====
app.get('/api/settings', auth, (req, res) => {
  res.json(store.settings);
});

app.patch('/api/settings', auth, megaOnly, (req, res) => {
  Object.assign(store.settings, req.body);
  res.json(store.settings);
});

// ===== DASHBOARD (Member summary view) =====
app.get('/api/member-dashboard', auth, (req, res) => {
  const member = store.members.find(m => m.email === req.user.email);
  if (!member) return res.json({});
  
  const fees = store.memberFees.filter(f => f.memberId === member.id).reduce((sum, f) => sum + (f.amount || 0), 0);
  const slcPoints = store.slcPoints.filter(sp => sp.memberId === member.id).reduce((sum, sp) => sum + (sp.points || 0), 0);
  const equipment = store.equipmentLogs.filter(l => l.memberId === member.id && !l.returnDate).length;
  const events = store.events.filter(e => e.memberIds?.includes(member.id) || []).length;
  const fundraisers = store.fundraisers.length;
  
  res.json({
    member,
    outstandingFees: fees,
    slcPoints,
    equipmentCount: equipment,
    eventsCount: events,
    fundraisersCount: fundraisers
  });
});

// ===== COMMITTEE LEAD DASHBOARD =====
app.get('/api/committee-lead-dashboard', auth, (req, res) => {
  if (req.user.role !== 'committee-lead' && req.user.role !== 'mega-admin') {
    return res.status(403).json({ error: 'Committee lead only' });
  }
  
  const comMember = store.committeeMembers.find(cm => cm.userId === req.user.id);
  if (!comMember) return res.json({});
  
  const committee = store.committees.find(c => c.id === comMember.committeeId);
  const members = store.committeeMembers.filter(cm => cm.committeeId === comMember.committeeId);
  const attendance = store.attendance.filter(a => a.committeeId === comMember.committeeId);
  
  res.json({
    committee,
    members,
    attendance,
    memberCount: members.length,
    attendanceCount: attendance.length
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
