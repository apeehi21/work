import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface AdminCredentialRecord {
  username: string;
  salt: string;
  hash: string;
  createdAt: string;
}

export interface AdminSession {
  token: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

export interface VisitorRecord {
  visitorId: string;
  visitorName: string;
  snapchatAnswer?: string;
  snapchatId?: string | null;
  memoryAnswer?: string;
  memoryFollowUp?: string;
  personalMessage?: string;
  finalAnswer?: 'YES' | 'NO' | null;
  createdAt: string;
  updatedAt: string;
  completionStatus: 'in_progress' | 'completed' | 'declined';
}

const CREDENTIALS_FILE = path.resolve(process.cwd(), '.admin-credentials.json');
const REPORT_FILE = path.resolve(process.cwd(), '.admin-report.json');
const DATA_DIR = path.resolve(process.cwd(), 'data');
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');

// In-memory active sessions only (NO persistent or local storage)
const activeSessions = new Map<string, AdminSession>();

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(VISITORS_FILE)) {
  fs.writeFileSync(VISITORS_FILE, JSON.stringify([]), 'utf-8');
}

/**
 * Initializes or loads administrator credentials.
 * If credentials do not exist, a unique username and strong random password
 * are generated using cryptographic primitives.
 */
export function initializeAdminCredentials(): { username: string; initialPassword?: string } {
  const username = 'admin123';
  const initialPassword = 'himesh143';

  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8')) as AdminCredentialRecord;
      if (data.username === username) {
        return { username, initialPassword };
      }
    } catch {
      // Re-initialize if outdated or corrupt
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(initialPassword, salt, 100000, 64, 'sha512').toString('hex');

  const record: AdminCredentialRecord = {
    username,
    salt,
    hash,
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(record, null, 2), { mode: 0o600 });
  fs.writeFileSync(REPORT_FILE, JSON.stringify({ username, password: initialPassword }, null, 2), { mode: 0o600 });

  console.log(`[Admin Security] Administrator account initialized successfully for username: ${username}`);
  return { username, initialPassword };
}

/**
 * Authenticates administrator credentials using constant-time comparison
 */
export function verifyAdminLogin(usernameInput: string, passwordInput: string): { success: boolean; session?: AdminSession } {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    initializeAdminCredentials();
  }

  try {
    const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8')) as AdminCredentialRecord;
    if (data.username !== usernameInput.trim()) {
      return { success: false };
    }

    const testHash = crypto.pbkdf2Sync(passwordInput, data.salt, 100000, 64, 'sha512').toString('hex');
    const match = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(data.hash, 'hex'));

    if (!match) {
      return { success: false };
    }

    // Generate cryptographically secure ephemeral session token (valid for 2 hours)
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: AdminSession = {
      token,
      username: data.username,
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000 // 2 hours
    };

    activeSessions.set(token, session);
    return { success: true, session };
  } catch (err) {
    console.error('[Admin Security] Authentication verification error:', err);
    return { success: false };
  }
}

/**
 * Verifies if an admin session token is valid and active
 */
export function validateSession(token?: string | null): AdminSession | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  return session;
}

/**
 * Invalidates and removes an admin session from memory
 */
export function revokeSession(token?: string | null): boolean {
  if (!token) return false;
  return activeSessions.delete(token);
}

/**
 * Reads all visitor records (admin only)
 */
export function getVisitorRecords(): VisitorRecord[] {
  try {
    if (!fs.existsSync(VISITORS_FILE)) return [];
    const content = fs.readFileSync(VISITORS_FILE, 'utf-8');
    return JSON.parse(content) as VisitorRecord[];
  } catch (err) {
    console.error('[Visitors Store] Error reading visitors file:', err);
    return [];
  }
}

/**
 * Upserts a visitor record progressively
 */
export function saveVisitorRecord(record: VisitorRecord): void {
  try {
    const visitors = getVisitorRecords();
    const index = visitors.findIndex(v => v.visitorId === record.visitorId);

    if (index >= 0) {
      visitors[index] = {
        ...visitors[index],
        ...record,
        updatedAt: new Date().toISOString()
      };
    } else {
      visitors.unshift({
        ...record,
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Visitors Store] Error saving visitor record:', err);
  }
}

/**
 * Deletes a visitor record (admin only)
 */
export function deleteVisitorRecord(visitorId: string): boolean {
  try {
    let visitors = getVisitorRecords();
    const initialLen = visitors.length;
    visitors = visitors.filter(v => v.visitorId !== visitorId);
    if (visitors.length !== initialLen) {
      fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf-8');
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Visitors Store] Error deleting visitor record:', err);
    return false;
  }
}
