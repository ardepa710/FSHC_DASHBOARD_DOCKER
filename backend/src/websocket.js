const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Store connected clients by project
const projectClients = new Map(); // projectId -> Set of { ws, userId, userName }

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId = null;
    let userName = null;
    let projectId = null;

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        switch (message.type) {
          case 'auth':
            // Authenticate the connection
            try {
              const decoded = jwt.verify(message.token, JWT_SECRET);
              userId = decoded.id;
              userName = decoded.name || 'User';
              ws.send(JSON.stringify({ type: 'auth_success', userId }));
            } catch (err) {
              ws.send(JSON.stringify({ type: 'auth_error', error: 'Invalid token' }));
            }
            break;

          case 'join_project':
            if (!userId) {
              ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }));
              return;
            }

            // Leave previous project if any
            if (projectId) {
              leaveProject(ws, projectId);
            }

            projectId = message.projectId;
            joinProject(ws, projectId, userId, userName);

            // Notify others in the project
            broadcastToProject(projectId, {
              type: 'user_joined',
              userId,
              userName,
              timestamp: new Date().toISOString(),
            }, ws);

            // Send current users list
            ws.send(JSON.stringify({
              type: 'users_list',
              users: getProjectUsers(projectId),
            }));
            break;

          case 'leave_project':
            if (projectId) {
              leaveProject(ws, projectId);
              broadcastToProject(projectId, {
                type: 'user_left',
                userId,
                userName,
                timestamp: new Date().toISOString(),
              });
              projectId = null;
            }
            break;

          case 'task_update':
            if (!projectId) return;
            broadcastToProject(projectId, {
              type: 'task_updated',
              taskId: message.taskId,
              changes: message.changes,
              userId,
              userName,
              timestamp: new Date().toISOString(),
            }, ws);
            break;

          case 'task_create':
            if (!projectId) return;
            broadcastToProject(projectId, {
              type: 'task_created',
              task: message.task,
              userId,
              userName,
              timestamp: new Date().toISOString(),
            }, ws);
            break;

          case 'task_delete':
            if (!projectId) return;
            broadcastToProject(projectId, {
              type: 'task_deleted',
              taskId: message.taskId,
              userId,
              userName,
              timestamp: new Date().toISOString(),
            }, ws);
            break;

          case 'presence':
            if (!projectId) return;
            broadcastToProject(projectId, {
              type: 'presence',
              userId,
              userName,
              action: message.action, // 'viewing', 'editing', 'idle'
              taskId: message.taskId,
              timestamp: new Date().toISOString(),
            }, ws);
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (projectId) {
        leaveProject(ws, projectId);
        broadcastToProject(projectId, {
          type: 'user_left',
          userId,
          userName,
          timestamp: new Date().toISOString(),
        });
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  // Heartbeat to detect broken connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('WebSocket server initialized');
  return wss;
}

function joinProject(ws, projectId, userId, userName) {
  if (!projectClients.has(projectId)) {
    projectClients.set(projectId, new Set());
  }
  projectClients.get(projectId).add({ ws, userId, userName });
}

function leaveProject(ws, projectId) {
  const clients = projectClients.get(projectId);
  if (clients) {
    for (const client of clients) {
      if (client.ws === ws) {
        clients.delete(client);
        break;
      }
    }
    if (clients.size === 0) {
      projectClients.delete(projectId);
    }
  }
}

function getProjectUsers(projectId) {
  const clients = projectClients.get(projectId);
  if (!clients) return [];
  return Array.from(clients).map(({ userId, userName }) => ({ userId, userName }));
}

function broadcastToProject(projectId, message, excludeWs = null) {
  const clients = projectClients.get(projectId);
  if (!clients) return;

  const data = JSON.stringify(message);
  for (const { ws } of clients) {
    if (ws !== excludeWs && ws.readyState === 1) { // WebSocket.OPEN = 1
      ws.send(data);
    }
  }
}

// Export function to broadcast from REST API handlers
function notifyProject(projectId, message) {
  broadcastToProject(projectId, message);
}

module.exports = { setupWebSocket, notifyProject };
