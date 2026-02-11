import { X, Trash2, Copy, ArrowRight, User, Flag, Tag, Calendar } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import {
  useBulkUpdateStatus,
  useBulkUpdateAssignee,
  useBulkDelete,
  useDuplicateTasks,
  usePhases,
  useAssignees,
} from '../hooks/useData';

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started', color: '#556' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#6c8cff' },
  { value: 'BLOCKED', label: 'Blocked', color: '#ef4444' },
  { value: 'DONE', label: 'Done', color: '#10b981' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

export default function BulkActionsBar() {
  const { selectedTasks, clearSelectedTasks } = useStore();
  const { data: phases = [] } = usePhases();
  const { data: assignees = [] } = useAssignees();

  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkUpdateAssignee = useBulkUpdateAssignee();
  const bulkDelete = useBulkDelete();
  const duplicateTasks = useDuplicateTasks();

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);

  if (selectedTasks.length === 0) return null;

  const handleStatusChange = async (status) => {
    try {
      await bulkUpdateStatus.mutateAsync({ taskIds: selectedTasks, status });
      toast.success(`${selectedTasks.length} tasks updated`);
      clearSelectedTasks();
      setShowStatusMenu(false);
    } catch (error) {
      toast.error('Failed to update tasks');
    }
  };

  const handleAssigneeChange = async (assigneeId) => {
    try {
      await bulkUpdateAssignee.mutateAsync({ taskIds: selectedTasks, assigneeId });
      toast.success(`${selectedTasks.length} tasks updated`);
      clearSelectedTasks();
      setShowAssigneeMenu(false);
    } catch (error) {
      toast.error('Failed to update tasks');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedTasks.length} tasks? This cannot be undone.`)) return;
    try {
      await bulkDelete.mutateAsync(selectedTasks);
      toast.success(`${selectedTasks.length} tasks deleted`);
      clearSelectedTasks();
    } catch (error) {
      toast.error('Failed to delete tasks');
    }
  };

  const handleDuplicate = async (targetPhaseId) => {
    try {
      await duplicateTasks.mutateAsync({ taskIds: selectedTasks, targetPhaseId });
      toast.success(`${selectedTasks.length} tasks duplicated`);
      clearSelectedTasks();
      setShowPhaseMenu(false);
    } catch (error) {
      toast.error('Failed to duplicate tasks');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-[#1a2035] border border-[#1e2640] rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-[#1e2640]">
          <span className="bg-[#6c8cff] text-white text-[12px] font-bold px-2 py-0.5 rounded">
            {selectedTasks.length}
          </span>
          <span className="text-[13px] text-white">selected</span>
          <button
            onClick={clearSelectedTasks}
            className="ml-1 text-[#8892a4] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowAssigneeMenu(false);
              setShowPhaseMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#8892a4] hover:text-white bg-[#253050] rounded-lg hover:bg-[#2d3a5c] transition-colors"
          >
            <Flag size={14} />
            Status
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-[#1a2035] border border-[#1e2640] rounded-lg shadow-xl overflow-hidden min-w-[140px]">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className="w-full text-left px-3 py-2 text-[12px] text-[#e0e0e0] hover:bg-[#253050] flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignee Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAssigneeMenu(!showAssigneeMenu);
              setShowStatusMenu(false);
              setShowPhaseMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#8892a4] hover:text-white bg-[#253050] rounded-lg hover:bg-[#2d3a5c] transition-colors"
          >
            <User size={14} />
            Assignee
          </button>
          {showAssigneeMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-[#1a2035] border border-[#1e2640] rounded-lg shadow-xl overflow-hidden min-w-[160px] max-h-48 overflow-y-auto">
              <button
                onClick={() => handleAssigneeChange(null)}
                className="w-full text-left px-3 py-2 text-[12px] text-[#556] hover:bg-[#253050]"
              >
                Unassigned
              </button>
              {assignees.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleAssigneeChange(a.id)}
                  className="w-full text-left px-3 py-2 text-[12px] text-[#e0e0e0] hover:bg-[#253050] flex items-center gap-2"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: a.color }}
                  >
                    {a.initials}
                  </div>
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Duplicate Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPhaseMenu(!showPhaseMenu);
              setShowStatusMenu(false);
              setShowAssigneeMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#8892a4] hover:text-white bg-[#253050] rounded-lg hover:bg-[#2d3a5c] transition-colors"
          >
            <Copy size={14} />
            Duplicate
          </button>
          {showPhaseMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-[#1a2035] border border-[#1e2640] rounded-lg shadow-xl overflow-hidden min-w-[180px] max-h-48 overflow-y-auto">
              <p className="px-3 py-2 text-[10px] text-[#556] border-b border-[#1e2640]">
                Duplicate to phase:
              </p>
              {phases.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleDuplicate(p.id)}
                  className="w-full text-left px-3 py-2 text-[12px] text-[#e0e0e0] hover:bg-[#253050] flex items-center gap-2"
                >
                  <span>{p.icon}</span>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={bulkDelete.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#ef4444] hover:text-white bg-[rgba(239,68,68,0.1)] rounded-lg hover:bg-[#ef4444] transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
