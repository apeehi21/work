import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  initializeAdminCredentials,
  verifyAdminLogin,
  validateSession,
  revokeSession,
  getVisitorRecords,
  saveVisitorRecord,
  deleteVisitorRecord,
  VisitorRecord
} from './adminService.ts';

// Helper to read JSON request body
async function readJsonBody<T = any>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : ({} as T));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

export function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api-plugin',
    configureServer(server: ViteDevServer) {
      // Initialize credentials at server startup
      initializeAdminCredentials();

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // 1. POST /api/admin/login
        if (req.method === 'POST' && url === '/api/admin/login') {
          try {
            const body = await readJsonBody(req);
            const { username, password } = body;

            if (!username || !password) {
              return sendJson(res, 400, { error: 'Username and password are required' });
            }

            const result = verifyAdminLogin(username, password);
            if (!result.success || !result.session) {
              return sendJson(res, 401, { error: 'Invalid username or password' });
            }

            return sendJson(res, 200, {
              success: true,
              token: result.session.token,
              username: result.session.username,
              expiresAt: result.session.expiresAt
            });
          } catch (err: any) {
            return sendJson(res, 500, { error: err.message || 'Login verification failed' });
          }
        }

        // 2. POST /api/admin/logout
        if (req.method === 'POST' && url === '/api/admin/logout') {
          const authHeader = req.headers['authorization'];
          const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
          revokeSession(token);
          return sendJson(res, 200, { success: true });
        }

        // 3. GET /api/admin/verify
        if (req.method === 'GET' && url === '/api/admin/verify') {
          const authHeader = req.headers['authorization'];
          const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
          const session = validateSession(token);
          if (!session) {
            return sendJson(res, 401, { error: 'Session expired or invalid' });
          }
          return sendJson(res, 200, { valid: true, username: session.username });
        }

        // 4. GET /api/admin/visitors
        if (req.method === 'GET' && url === '/api/admin/visitors') {
          const authHeader = req.headers['authorization'];
          const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
          const session = validateSession(token);
          if (!session) {
            return sendJson(res, 401, { error: 'Unauthorized: Admin authentication required' });
          }

          const visitors = getVisitorRecords();
          return sendJson(res, 200, { visitors });
        }

        // 5. POST /api/visitors/sync
        if (req.method === 'POST' && url === '/api/visitors/sync') {
          try {
            const body = await readJsonBody<VisitorRecord>(req);
            if (!body.visitorId || !body.visitorName) {
              return sendJson(res, 400, { error: 'Missing visitorId or visitorName' });
            }
            saveVisitorRecord(body);
            return sendJson(res, 200, { success: true });
          } catch (err: any) {
            return sendJson(res, 500, { error: err.message || 'Sync failed' });
          }
        }

        // 6. DELETE /api/admin/visitors/:id
        if (req.method === 'DELETE' && url?.startsWith('/api/admin/visitors/')) {
          const authHeader = req.headers['authorization'];
          const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
          const session = validateSession(token);
          if (!session) {
            return sendJson(res, 401, { error: 'Unauthorized' });
          }

          const visitorId = url.slice('/api/admin/visitors/'.length);
          const deleted = deleteVisitorRecord(visitorId);
          return sendJson(res, 200, { success: deleted });
        }

        next();
      });
    }
  };
}
