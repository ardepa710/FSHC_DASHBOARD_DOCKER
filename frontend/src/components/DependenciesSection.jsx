import { useState } from 'react';
import { Link2, Plus, X, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDependencies, useAddDependency, useRemoveDependency, useTasks } from '../hooks/useData';
import clsx from 'clsx';

const statusColors = {
  NOT_STARTED: '#556',
  IN_PROGRESS: '#6c8cff',
  BLOCKED: '#ef4444',
  DONE: '#10b981',
};

export default function DependenciesSection({ taskId, currentTaskTitle }) {
  const { data: deps, isLoading } = useDependencies(taskId);
  const { data: allTasks = [] } = useTasks();
  const addDependency = useAddDependency();
  const removeDependency = useRemoveDependency();

  const [showSelector, setShowSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const blockedBy = deps?.blockedBy || [];
  const blocking = deps?.blocking || [];

  // Get IDs of tasks already in dependencies
  const existingDepIds = [
    ...blockedBy.map(d => d.blockingTask.id),
    ...blocking.map(d => d.dependentTask.id),
    taskId,
  ];

  // Filter available tasks
  const availableTasks = allTasks.filter(
    t => !existingDepIds.includes(t.id) &&
    (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.phase?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddDependency = async (blockingTaskId) => {
    try {
      await addDependency.mutateAsync({ taskId, blockingTaskId });
      setShowSelector(false);
      setSearchTerm('');
      toast.success('Dependency added');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (blockingTaskId) => {
    try {
      await removeDependency.mutateAsync({ taskId, blockingTaskId });
      toast.success('Dependency removed');
    } catch (error) {
      toast.error('Failed to remove dependency');
    }
  };

  const allBlockersComplete = blockedBy.every(d => d.blockingTask.status === 'DONE');

  return (
    <div className="mt-5 pt-5 border-t border-[#1e2640]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[12px] font-semibold text-[#8892a4] flex items-center gap-2">
          <Link2 size={14} />
          Dependencies
        </h4>
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="text-[#6c8cff] hover:text-white transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Status indicator */}
      {blockedBy.length > 0 && (
        <div className={clsx(
          'mb-3 px-3 py-2 rounded-lg text-[11px] flex items-center gap-2',
          allBlockersComplete
            ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981]'
            : 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
        )}>
          {allBlockersComplete ? (
            <>
              <Check size={14} />
              All dependencies resolved
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              Waiting for {blockedBy.filter(d => d.blockingTask.status !== 'DONE').length} task(s)
            </>
          )}
        </div>
      )}

      {/* Task Selector */}
      {showSelector && (
        <div className="mb-3 bg-[#1a2035] border border-[#1e2640] rounded-lg p-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks to add as blocker..."
            className="w-full bg-[#253050] border border-[#1e2640] rounded px-3 py-1.5 text-[12px] text-white outline-none focus:border-[#6c8cff] mb-2"
            autoFocus
          />
          <div className="max-h-40 overflow-y-auto">
            {availableTasks.length === 0 ? (
              <p className="text-[11px] text-[#556] text-center py-2">No tasks found</p>
            ) : (
              availableTasks.slice(0, 10).map(task => (
                <button
                  key={task.id}
                  onClick={() => handleAddDependency(task.id)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-[#253050] transition-colors flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: statusColors[task.status] }}
                  />
                  <span className="text-[12px] text-white truncate flex-1">{task.title}</span>
                  <span className="text-[10px] text-[#556] shrink-0">{task.phase?.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-[#8892a4] py-4">Loading...</div>
      ) : (
        <div className="space-y-3">
          {/* Blocked By (this task waits for these) */}
          {blockedBy.length > 0 && (
            <div>
              <p className="text-[10px] text-[#556] uppercase tracking-wider mb-1.5">
                This task is blocked by:
              </p>
              <div className="space-y-1">
                {blockedBy.map(dep => (
                  <div
                    key={dep.id}
                    className="flex items-center gap-2 bg-[#1a2035] rounded px-3 py-2 group"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: statusColors[dep.blockingTask.status] }}
                    />
                    <span className="text-[12px] text-white truncate flex-1">
                      {dep.blockingTask.title}
                    </span>
                    {dep.blockingTask.status === 'DONE' && (
                      <Check size={12} className="text-[#10b981] shrink-0" />
                    )}
                    <button
                      onClick={() => handleRemoveDependency(dep.blockingTask.id)}
                      className="text-[#556] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocking (these tasks wait for this one) */}
          {blocking.length > 0 && (
            <div>
              <p className="text-[10px] text-[#556] uppercase tracking-wider mb-1.5">
                This task blocks:
              </p>
              <div className="space-y-1">
                {blocking.map(dep => (
                  <div
                    key={dep.id}
                    className="flex items-center gap-2 bg-[#1a2035] rounded px-3 py-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: statusColors[dep.dependentTask.status] }}
                    />
                    <span className="text-[12px] text-[#8892a4] truncate flex-1">
                      {dep.dependentTask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blockedBy.length === 0 && blocking.length === 0 && (
            <p className="text-[12px] text-[#556] text-center py-2">No dependencies</p>
          )}
        </div>
      )}
    </div>
  );
}
