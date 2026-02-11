import { ChevronDown, Check, ChevronRight, Square, CheckSquare } from 'lucide-react';
import useStore from '../store/useStore';
import { useTasks, usePhases, useUpdateTaskStatus } from '../hooks/useData';
import clsx from 'clsx';

const statusLabels = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const statusClasses = {
  NOT_STARTED: 'bg-[rgba(85,85,102,0.2)] text-[#556]',
  IN_PROGRESS: 'bg-[rgba(108,140,255,0.15)] text-[#6c8cff]',
  BLOCKED: 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]',
  DONE: 'bg-[rgba(16,185,129,0.15)] text-[#10b981]',
};

const dotColors = {
  NOT_STARTED: 'bg-[#556]',
  IN_PROGRESS: 'bg-[#6c8cff]',
  BLOCKED: 'bg-[#ef4444]',
  DONE: 'bg-[#10b981]',
};

const priorityColors = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#556',
};

export default function ListView() {
  const {
    currentPhaseFilter,
    statusFilters,
    searchQuery,
    collapsedPhases,
    togglePhaseCollapse,
    openDetail,
    selectedTasks,
    toggleTaskSelection,
    setSelectedTasks,
    clearSelectedTasks,
  } = useStore();

  const { data: tasks = [], isLoading } = useTasks({
    phase: currentPhaseFilter !== 'all' ? currentPhaseFilter : undefined,
    search: searchQuery || undefined,
  });
  const { data: phases = [] } = usePhases();
  const updateStatus = useUpdateTaskStatus();

  const filteredTasks = tasks.filter((t) => statusFilters.includes(t.status));

  // Group by phase
  const tasksByPhase = {};
  filteredTasks.forEach((task) => {
    const phaseId = task.phaseId;
    if (!tasksByPhase[phaseId]) {
      tasksByPhase[phaseId] = [];
    }
    tasksByPhase[phaseId].push(task);
  });

  const toggleDone = (e, task) => {
    e.stopPropagation();
    const newStatus = task.status === 'DONE' ? 'NOT_STARTED' : 'DONE';
    updateStatus.mutate({ id: task.id, status: newStatus });
  };

  const formatDueDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
  };

  const getDueClass = (date) => {
    if (!date) return '';
    const now = new Date();
    const due = new Date(date);
    const diff = (due - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'text-[#ef4444] font-semibold';
    if (diff < 7) return 'text-[#f59e0b]';
    return '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8892a4]">
        Loading...
      </div>
    );
  }

  // Summary cards
  const summary = {
    total: filteredTasks.length,
    inProgress: filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: filteredTasks.filter((t) => t.status === 'DONE').length,
    blocked: filteredTasks.filter((t) => t.status === 'BLOCKED').length,
    high: filteredTasks.filter((t) => t.priority === 'HIGH' && t.status !== 'DONE').length,
  };

  const phasesCount = currentPhaseFilter === 'all' ? phases.length : 1;

  return (
    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-[#111827] border border-[#1e2640] rounded-xl p-4 sm:p-5">
          <p className="text-[10px] sm:text-[11px] text-[#8892a4] mb-1">Total Tasks</p>
          <p className="text-2xl sm:text-[28px] font-bold text-white">{summary.total}</p>
          <p className="text-[10px] sm:text-[11px] text-[#556] mt-0.5">
            {phasesCount} phase{phasesCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-[#111827] border border-[#1e2640] rounded-xl p-4 sm:p-5">
          <p className="text-[10px] sm:text-[11px] text-[#8892a4] mb-1">In Progress</p>
          <p className="text-2xl sm:text-[28px] font-bold text-[#6c8cff]">{summary.inProgress}</p>
          <p className="text-[10px] sm:text-[11px] text-[#556] mt-0.5">{summary.done} completed</p>
        </div>
        <div className="bg-[#111827] border border-[#1e2640] rounded-xl p-4 sm:p-5">
          <p className="text-[10px] sm:text-[11px] text-[#8892a4] mb-1">Blocked</p>
          <p className={`text-2xl sm:text-[28px] font-bold ${summary.blocked > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
            {summary.blocked}
          </p>
          <p className="text-[10px] sm:text-[11px] text-[#556] mt-0.5">
            {summary.blocked > 0 ? 'needs attention' : 'all clear'}
          </p>
        </div>
        <div className="bg-[#111827] border border-[#1e2640] rounded-xl p-4 sm:p-5">
          <p className="text-[10px] sm:text-[11px] text-[#8892a4] mb-1">High Priority</p>
          <p className="text-2xl sm:text-[28px] font-bold text-[#f59e0b]">{summary.high}</p>
          <p className="text-[10px] sm:text-[11px] text-[#556] mt-0.5">pending</p>
        </div>
      </div>

      {/* Phase Groups */}
      {phases
        .filter((phase) => currentPhaseFilter === 'all' || phase.id === currentPhaseFilter)
        .map((phase) => {
          const phaseTasks = tasksByPhase[phase.id] || [];
          if (phaseTasks.length === 0 && currentPhaseFilter === 'all') return null;

          const isCollapsed = collapsedPhases.includes(phase.id);
          const doneTasks = phaseTasks.filter(t => t.status === 'DONE').length;
          const progress = phaseTasks.length > 0 ? Math.round((doneTasks / phaseTasks.length) * 100) : 0;

          return (
            <div key={phase.id} className="mb-6">
              {/* Phase Header */}
              <button
                className="w-full flex items-center gap-2 sm:gap-3 py-3 cursor-pointer select-none hover:bg-[#111827]/50 rounded-lg px-2 -mx-2 transition-[background-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] focus-visible:ring-inset"
                onClick={() => togglePhaseCollapse(phase.id)}
                aria-expanded={!isCollapsed}
                aria-label={`${phase.name} phase, ${phaseTasks.length} tasks, ${isCollapsed ? 'expand' : 'collapse'}`}
              >
                <ChevronDown
                  size={14}
                  className={clsx(
                    'text-[#556] transition-transform shrink-0',
                    isCollapsed && '-rotate-90'
                  )}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: phase.color }}
                />
                <span className="text-lg shrink-0">{phase.icon}</span>
                <h3 className="text-[13px] sm:text-[14px] font-semibold text-white truncate">
                  {phase.name}
                </h3>
                <span className="text-[11px] text-[#556] shrink-0">
                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                </span>
                <div className="ml-auto flex items-center gap-2 sm:gap-3 text-[11px] text-[#556] shrink-0">
                  <span className="hidden sm:inline">{doneTasks}/{phaseTasks.length}</span>
                  <div className="w-16 sm:w-20 h-1.5 bg-[#253050] rounded-full overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${progress}%`,
                        background: phase.color,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right">{progress}%</span>
                </div>
              </button>

              {/* Tasks */}
              {!isCollapsed && (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-[#1e2640]">
                          <th className="text-[10px] font-semibold uppercase tracking-wider text-[#556] text-left py-3 pl-3 w-8">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const phaseTaskIds = phaseTasks.map(t => t.id);
                                const allSelected = phaseTaskIds.every(id => selectedTasks.includes(id));
                                if (allSelected) {
                                  setSelectedTasks(selectedTasks.filter(id => !phaseTaskIds.includes(id)));
                                } else {
                                  setSelectedTasks([...new Set([...selectedTasks, ...phaseTaskIds])]);
                                }
                              }}
                              aria-label={phaseTasks.every(t => selectedTasks.includes(t.id)) ? `Deselect all tasks in ${phase.name}` : `Select all tasks in ${phase.name}`}
                              className="text-[#556] hover:text-[#6c8cff] transition-[color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] rounded"
                            >
                              {phaseTasks.length > 0 && phaseTasks.every(t => selectedTasks.includes(t.id)) ? (
                                <CheckSquare size={16} className="text-[#6c8cff]" aria-hidden="true" />
                              ) : (
                                <Square size={16} aria-hidden="true" />
                              )}
                            </button>
                          </th>
                          <th className="text-[10px] font-semibold uppercase tracking-wider text-[#556] text-left py-3 pl-2 pr-4 w-[42%]">
                            Task
                          </th>
                          <th className="text-[10px] font-semibold uppercase tracking-wider text-[#556] text-left py-3 px-4 w-[20%]">
                            Status
                          </th>
                          <th className="text-[10px] font-semibold uppercase tracking-wider text-[#556] text-left py-3 px-4 w-[12%]">
                            Assignee
                          </th>
                          <th className="text-[10px] font-semibold uppercase tracking-wider text-[#556] text-left py-3 px-4 w-[10%]">
                            Priority
                          </th>
                          <th className="text-[10px] font-semibold uppercase tracking-wider text-[#556] text-left py-3 px-4 w-[13%]">
                            Due
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {phaseTasks.map((task) => (
                          <tr
                            key={task.id}
                            className={clsx(
                              'hover:bg-[#1a2035] cursor-pointer transition-[background-color] border-b border-[rgba(30,38,64,0.5)]',
                              selectedTasks.includes(task.id) && 'bg-[rgba(108,140,255,0.08)]'
                            )}
                            onClick={() => openDetail(task.id)}
                          >
                            <td className="py-3 pl-3 w-8">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskSelection(task.id);
                                }}
                                aria-label={selectedTasks.includes(task.id) ? `Deselect task: ${task.title}` : `Select task: ${task.title}`}
                                className="text-[#556] hover:text-[#6c8cff] transition-[color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] rounded"
                              >
                                {selectedTasks.includes(task.id) ? (
                                  <CheckSquare size={16} className="text-[#6c8cff]" aria-hidden="true" />
                                ) : (
                                  <Square size={16} aria-hidden="true" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 pl-2 pr-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => toggleDone(e, task)}
                                  aria-label={task.status === 'DONE' ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                                  className={clsx(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-[border-color,background-color,color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1c]',
                                    task.status === 'DONE'
                                      ? 'border-[#10b981] bg-[#10b981] text-white'
                                      : 'border-[#556] hover:border-[#6c8cff]'
                                  )}
                                >
                                  {task.status === 'DONE' && <Check size={12} aria-hidden="true" />}
                                </button>
                                <span
                                  className={clsx(
                                    'text-[13px] leading-snug',
                                    task.status === 'DONE'
                                      ? 'text-[#556] line-through'
                                      : 'text-[#e0e0e0]'
                                  )}
                                >
                                  {task.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={clsx(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap',
                                  statusClasses[task.status]
                                )}
                              >
                                <span
                                  className={clsx(
                                    'w-1.5 h-1.5 rounded-full',
                                    dotColors[task.status]
                                  )}
                                />
                                {statusLabels[task.status]}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {task.assignee ? (
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                  style={{ background: task.assignee.color }}
                                  title={task.assignee.name}
                                >
                                  {task.assignee.initials}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#556]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  {[0, 1, 2].map((i) => (
                                    <span
                                      key={i}
                                      className="w-[4px] h-3 rounded-sm"
                                      style={{
                                        background:
                                          (task.priority === 'HIGH' && i < 3) ||
                                          (task.priority === 'MEDIUM' && i < 2) ||
                                          (task.priority === 'LOW' && i < 1)
                                            ? priorityColors[task.priority]
                                            : '#253050',
                                      }}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-[#556] capitalize">
                                  {task.priority.toLowerCase()}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={clsx('text-[12px] text-[#8892a4]', getDueClass(task.dueDate))}
                              >
                                {formatDueDate(task.dueDate) || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-2 mt-2">
                    {phaseTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#111827] border border-[#1e2640] rounded-lg p-3 cursor-pointer hover:border-[#6c8cff] transition-[border-color]"
                        onClick={() => openDetail(task.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(task.id); } }}
                        aria-label={`View details for task: ${task.title}`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => toggleDone(e, task)}
                            aria-label={task.status === 'DONE' ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                            className={clsx(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-[border-color,background-color,color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1c]',
                              task.status === 'DONE'
                                ? 'border-[#10b981] bg-[#10b981] text-white'
                                : 'border-[#556] hover:border-[#6c8cff]'
                            )}
                          >
                            {task.status === 'DONE' && <Check size={12} aria-hidden="true" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={clsx(
                                'text-[13px] leading-snug mb-2',
                                task.status === 'DONE'
                                  ? 'text-[#556] line-through'
                                  : 'text-[#e0e0e0]'
                              )}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center flex-wrap gap-2">
                              <span
                                className={clsx(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                  statusClasses[task.status]
                                )}
                              >
                                <span
                                  className={clsx(
                                    'w-1.5 h-1.5 rounded-full',
                                    dotColors[task.status]
                                  )}
                                />
                                {statusLabels[task.status]}
                              </span>
                              {task.assignee && (
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                  style={{ background: task.assignee.color }}
                                >
                                  {task.assignee.initials}
                                </div>
                              )}
                              <div className="flex gap-0.5">
                                {[0, 1, 2].map((i) => (
                                  <span
                                    key={i}
                                    className="w-[3px] h-2 rounded-sm"
                                    style={{
                                      background:
                                        (task.priority === 'HIGH' && i < 3) ||
                                        (task.priority === 'MEDIUM' && i < 2) ||
                                        (task.priority === 'LOW' && i < 1)
                                          ? priorityColors[task.priority]
                                          : '#253050',
                                    }}
                                  />
                                ))}
                              </div>
                              {task.dueDate && (
                                <span
                                  className={clsx('text-[10px] text-[#8892a4]', getDueClass(task.dueDate))}
                                >
                                  {formatDueDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-[#556] shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#8892a4] text-[14px]">No tasks found</p>
          <p className="text-[#556] text-[12px] mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
