import { useState } from 'react';
import { X, Activity, Filter } from 'lucide-react';
import { useProjectActivities } from '../hooks/useData';

const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'just now';
};

const actionIcons = {
  CREATED: '➕',
  UPDATED: '✏️',
  DELETED: '🗑️',
  STATUS_CHANGED: '🔄',
  ASSIGNED: '👤',
  UNASSIGNED: '👤',
  COMMENT_ADDED: '💬',
  ATTACHMENT_ADDED: '📎',
  DEPENDENCY_ADDED: '🔗',
  DEPENDENCY_REMOVED: '🔗',
};

const actionLabels = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGED: 'changed status of',
  ASSIGNED: 'assigned',
  UNASSIGNED: 'unassigned',
  COMMENT_ADDED: 'commented on',
  ATTACHMENT_ADDED: 'attached file to',
  DEPENDENCY_ADDED: 'added dependency to',
  DEPENDENCY_REMOVED: 'removed dependency from',
};

export default function ActivityLogPanel({ isOpen, onClose }) {
  const [entityFilter, setEntityFilter] = useState('');
  const { data: activities = [], isLoading } = useProjectActivities({ entityType: entityFilter || undefined, limit: 100 });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[90]" onClick={onClose} />
      <div className="fixed top-0 right-0 w-full sm:w-[420px] h-screen bg-[#111827] border-l border-[#1e2640] z-[91] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#6c8cff]" />
            <h2 className="text-[15px] font-semibold text-white">Activity Log</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#8892a4] hover:text-white transition-[color]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter */}
        <div className="px-4 py-3 border-b border-[#1e2640]">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#556]" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="flex-1 bg-[#1a2035] border border-[#1e2640] rounded-lg py-1.5 px-3 text-[12px] text-white focus:border-[#6c8cff] outline-none"
            >
              <option value="">All activities</option>
              <option value="task">Tasks only</option>
              <option value="project">Project only</option>
              <option value="phase">Phases only</option>
            </select>
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-[#8892a4]">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#8892a4]">
              <Activity size={32} className="mb-2 opacity-50" />
              <p className="text-[13px]">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e2640]">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-[#1a2035] transition-[background-color]">
                  <div className="flex gap-3">
                    <div className="text-lg shrink-0">
                      {actionIcons[activity.action] || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white">
                        <span className="font-medium">{activity.user?.name || 'System'}</span>
                        {' '}
                        <span className="text-[#8892a4]">{actionLabels[activity.action] || activity.action}</span>
                        {' '}
                        <span className="font-medium">{activity.entityName || activity.entityType}</span>
                      </p>
                      {activity.changes && (
                        <p className="text-[11px] text-[#556] mt-1">
                          {(() => {
                            try {
                              const changes = JSON.parse(activity.changes);
                              if (changes.from && changes.to) {
                                return `${changes.from} → ${changes.to}`;
                              }
                              return JSON.stringify(changes);
                            } catch {
                              return activity.changes;
                            }
                          })()}
                        </p>
                      )}
                      <p className="text-[10px] text-[#556] mt-1">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
