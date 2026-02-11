import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useStore from '../store/useStore';

const WS_URL = `ws://${window.location.hostname}:3001/ws`;

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userPresence, setUserPresence] = useState({});

  const queryClient = useQueryClient();
  const token = useStore((state) => state.token);
  const currentProject = useStore((state) => state.currentProject);

  // Handle incoming messages
  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case 'auth_success':
        if (currentProject?.id && wsRef.current?.readyState === 1) {
          wsRef.current.send(JSON.stringify({
            type: 'join_project',
            projectId: currentProject.id,
          }));
        }
        break;

      case 'users_list':
        setOnlineUsers(message.users || []);
        break;

      case 'user_joined':
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.userId === message.userId)) return prev;
          return [...prev, { userId: message.userId, userName: message.userName }];
        });
        break;

      case 'user_left':
        setOnlineUsers((prev) => prev.filter((u) => u.userId !== message.userId));
        setUserPresence((prev) => {
          const updated = { ...prev };
          for (const taskId of Object.keys(updated)) {
            updated[taskId] = updated[taskId].filter((p) => p.userId !== message.userId);
            if (updated[taskId].length === 0) delete updated[taskId];
          }
          return updated;
        });
        break;

      case 'task_created':
      case 'task_updated':
      case 'task_deleted':
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task'] });
        queryClient.invalidateQueries({ queryKey: ['projectStats'] });
        break;

      case 'presence':
        setUserPresence((prev) => {
          const taskId = message.taskId;
          if (!taskId) return prev;

          const updated = { ...prev };
          if (!updated[taskId]) updated[taskId] = [];

          updated[taskId] = updated[taskId].filter((p) => p.userId !== message.userId);

          if (message.action !== 'idle') {
            updated[taskId].push({
              userId: message.userId,
              userName: message.userName,
              action: message.action,
            });
          }

          if (updated[taskId].length === 0) delete updated[taskId];
          return updated;
        });
        break;

      default:
        break;
    }
  }, [currentProject?.id, queryClient]);

  // Store handleMessage in ref to avoid stale closure
  const handleMessageRef = useRef(handleMessage);
  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  // Connect to WebSocket
  useEffect(() => {
    if (!token) return;

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          ws.send(JSON.stringify({ type: 'auth', token }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleMessageRef.current(message);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          setOnlineUsers([]);
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
        };
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  // Join project when it changes
  useEffect(() => {
    if (isConnected && currentProject?.id && wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: 'join_project',
        projectId: currentProject.id,
      }));
    }
  }, [isConnected, currentProject?.id]);

  // Send functions
  const sendTaskUpdate = useCallback((taskId, changes) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'task_update', taskId, changes }));
    }
  }, []);

  const sendTaskCreate = useCallback((task) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'task_create', task }));
    }
  }, []);

  const sendTaskDelete = useCallback((taskId) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'task_delete', taskId }));
    }
  }, []);

  const sendPresence = useCallback((taskId, action) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'presence', taskId, action }));
    }
  }, []);

  const value = {
    isConnected,
    onlineUsers,
    userPresence,
    sendTaskUpdate,
    sendTaskCreate,
    sendTaskDelete,
    sendPresence,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  return useContext(WebSocketContext);
}
