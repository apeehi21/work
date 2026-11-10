import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeAdminCredentials,
  verifyAdminLogin,
  validateSession,
  revokeSession,
  getVisitorRecords,
  saveVisitorRecord,
  deleteVisitorRecord
} from './server/adminService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize administrator credentials securely
initializeAdminCredentials();

// Disable caching on all API responses for security
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// 1. POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const result = verifyAdminLogin(username, password);
  if (!result.success || !result.session) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  return res.json({
    success: true,
    token: result.session.token,
    username: result.session.username,
    expiresAt: result.session.expiresAt
  });
});

// 2. POST /api/admin/logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  revokeSession(token);
  return res.json({ success: true });
});

// 3. GET /api/admin/verify
app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized or session expired' });
  }
  return res.json({ valid: true, username: session.username });
});

// 4. GET /api/admin/visitors
app.get('/api/admin/visitors', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const visitors = getVisitorRecords();
  return res.json({ visitors });
});

// 5. POST /api/visitors/sync
app.post('/api/visitors/sync', (req, res) => {
  const body = req.body;
  if (!body.visitorId || !body.visitorName) {
    return res.status(400).json({ error: 'Missing visitorId or visitorName' });
  }
  saveVisitorRecord(body);
  return res.json({ success: true });
});

// 6. DELETE /api/admin/visitors/:id
app.delete('/api/admin/visitors/:id', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const deleted = deleteVisitorRecord(req.params.id);
  return res.json({ success: deleted });
});

// Serve frontend static build files
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for client routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
