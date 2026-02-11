import useStore from '../store/useStore';
import { useTasks, useUpdateTaskStatus } from '../hooks/useData';

const columns = [
  { key: 'NOT_STARTED', label: 'Not Started', color: '#556' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#6c8cff' },
  { key: 'BLOCKED', label: 'Blocked', color: '#ef4444' },
  { key: 'DONE', label: 'Done', color: '#10b981' },
];

const priorityColors = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#556',
};

export default function BoardView() {
  const { currentPhaseFilter, statusFilters, searchQuery, openDetail } = useStore();

  const { data: tasks = [], isLoading } = useTasks({
    phase: currentPhaseFilter !== 'all' ? currentPhaseFilter : undefined,
    search: searchQuery || undefined,
  });

  const filteredTasks = tasks.filter((t) => statusFilters.includes(t.status));

  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8892a4]">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 overflow-x-auto flex-1">
      <div className="flex gap-3 sm:gap-4 min-h-[calc(100vh-180px)] pb-4">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter((t) => t.status === column.key);

          return (
            <div
              key={column.key}
              className="w-[260px] sm:w-[280px] lg:w-[300px] shrink-0 bg-[#111827] rounded-xl border border-[#1e2640] flex flex-col"
            >
              {/* Column Header */}
              <div className="p-3 sm:p-4 border-b border-[#1e2640] flex items-center gap-2.5 shrink-0">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: column.color }}
                />
                <h4 className="text-[13px] font-semibold text-white">{column.label}</h4>
                <span className="ml-auto text-[11px] text-[#8892a4] bg-[#253050] px-2.5 py-0.5 rounded-full font-medium">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="p-2 sm:p-3 overflow-y-auto flex-1 space-y-2">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-[#556] text-[12px]">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openDetail(task.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(task.id); } }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View task: ${task.title}`}
                      className={`bg-[#1a2035] border border-[#1e2640] rounded-lg p-3 cursor-pointer transition-[border-color,transform,box-shadow] hover:border-[#6c8cff] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] ${
                        task.status === 'DONE' ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Phase tag */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{task.phase?.icon}</span>
                        <p
                          className="text-[10px] font-semibold uppercase tracking-wide truncate"
                          style={{ color: task.phase?.color || '#8892a4' }}
                        >
                          {task.phase?.name || 'Unknown Phase'}
                        </p>
                      </div>

                      {/* Title */}
                      <p
                        className={`text-[13px] font-medium leading-snug mb-3 line-clamp-2 ${
                          task.status === 'DONE'
                            ? 'text-[#556] line-through'
                            : 'text-[#e0e0e0]'
                        }`}
                      >
                        {task.title}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ background: task.assignee.color }}
                            title={task.assignee.name}
                          >
                            {task.assignee.initials}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#253050] flex items-center justify-center text-[#556] text-[10px] shrink-0">
                            ?
                          </div>
                        )}

                        {/* Priority bars */}
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-[3px] h-2.5 rounded-sm"
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
                          <span className="ml-auto text-[10px] text-[#556]">
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
