import { Users, Wifi, WifiOff } from 'lucide-react';
import { useWebSocketContext } from '../hooks/useWebSocket';

export default function OnlineUsers() {
  const ws = useWebSocketContext();

  if (!ws) return null;

  const { isConnected, onlineUsers } = ws;

  return (
    <div className="flex items-center gap-2">
      {/* Connection status */}
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] ${
          isConnected
            ? 'bg-[var(--green)]/10 text-[var(--green)]'
            : 'bg-[var(--red)]/10 text-[var(--red)]'
        }`}
        title={isConnected ? 'Connected - Real-time updates active' : 'Disconnected - Reconnecting...'}
      >
        {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
      </div>

      {/* Online users */}
      {isConnected && onlineUsers.length > 0 && (
        <div className="flex items-center gap-1">
          <Users size={14} className="text-[var(--text3)]" />
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 5).map((user, idx) => (
              <div
                key={user.userId}
                className="w-6 h-6 rounded-full bg-[var(--blue)] flex items-center justify-center text-[9px] font-bold text-white border-2 border-[var(--bg1)]"
                title={user.userName}
                style={{ zIndex: 5 - idx }}
              >
                {user.userName?.slice(0, 2).toUpperCase() || '?'}
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div
                className="w-6 h-6 rounded-full bg-[var(--bg3)] flex items-center justify-center text-[9px] font-medium text-[var(--text2)] border-2 border-[var(--bg1)]"
                title={`+${onlineUsers.length - 5} more`}
              >
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Small indicator for task cards showing who's viewing/editing
export function TaskPresenceIndicator({ taskId }) {
  const ws = useWebSocketContext();

  if (!ws) return null;

  const presence = ws.userPresence[taskId];
  if (!presence || presence.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {presence.map((p) => (
        <div
          key={p.userId}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
            p.action === 'editing' ? 'bg-[var(--amber)] animate-pulse' : 'bg-[var(--blue)]'
          }`}
          title={`${p.userName} is ${p.action}`}
        >
          {p.userName?.slice(0, 1).toUpperCase() || '?'}
        </div>
      ))}
    </div>
  );
}
