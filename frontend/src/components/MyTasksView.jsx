import { User, Clock, AlertTriangle, CheckCircle2, Circle, Pause, Calendar } from 'lucide-react';
import { useMyTasks } from '../hooks/useData';
import useStore from '../store/useStore';
import clsx from 'clsx';

const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
};

const statusConfig = {
  NOT_STARTED: { label: 'Not Started', icon: Circle, color: '#556' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, color: '#6c8cff' },
  BLOCKED: { label: 'Blocked', icon: Pause, color: '#ef4444' },
  DONE: { label: 'Done', icon: CheckCircle2, color: '#10b981' },
};

const priorityColors = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#556',
};

function TaskCard({ task, openDetail }) {
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      onClick={() => openDetail(task.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(task.id); } }}
      role="button"
      tabIndex={0}
      aria-label={`View task: ${task.title}`}
      className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-4 hover:border-[#6c8cff] cursor-pointer transition-[border-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c8cff] group"
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${config.color}20` }}
        >
          <StatusIcon size={16} style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-medium text-white truncate group-hover:text-[#6c8cff] transition-[color]">
              {task.title}
            </h3>
            {task.priority === 'HIGH' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(239,68,68,0.15)] text-[#ef4444] font-semibold">
                HIGH
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#8892a4]">
            {/* Project */}
            <span className="flex items-center gap-1">
              <span style={{ color: task.phase?.project?.color || '#6c8cff' }}>
                {task.phase?.project?.icon || '📁'}
              </span>
              {task.phase?.project?.name || 'Project'}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span className={clsx(
                'flex items-center gap-1',
                isOverdue && 'text-[#ef4444] font-medium'
              )}>
                <Calendar size={12} aria-hidden="true" />
                {formatDate(task.dueDate)}
              </span>
            )}

            {/* Assignee */}
            {task.assignee && (
              <span className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: task.assignee.color }}
                >
                  {task.assignee.initials}
                </div>
                {task.assignee.name}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="flex gap-1 mt-2">
              {task.tags.slice(0, 3).map(tt => (
                <span
                  key={tt.tag?.id || tt.tagId}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                  style={{
                    background: `${tt.tag?.color || '#6c8cff'}20`,
                    color: tt.tag?.color || '#6c8cff',
                  }}
                >
                  {tt.tag?.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Priority Indicator */}
        <div className="flex flex-col gap-0.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1 h-2 rounded-sm"
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
      </div>
    </div>
  );
}

function TaskSection({ title, icon: Icon, tasks, color, openDetail }) {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color }} />
        <h3 className="text-[13px] font-semibold text-white">{title}</h3>
        <span className="text-[11px] text-[#556] bg-[#1a2035] px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} openDetail={openDetail} />
        ))}
      </div>
    </div>
  );
}

export default function MyTasksView() {
  const { openDetail } = useStore();
  const { data, isLoading } = useMyTasks();

  const tasks = data?.tasks || {};
  const summary = data?.summary || {};

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-[#8892a4]">
        Loading your tasks...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6c8cff] flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">My Tasks</h1>
            <p className="text-[12px] text-[#8892a4]">
              {summary.total || 0} tasks to complete
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#ef4444]" />
            <span className="text-[20px] font-bold text-[#ef4444]">{summary.overdue || 0}</span>
          </div>
          <p className="text-[11px] text-[#ef4444] mt-1">Overdue</p>
        </div>
        <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#f59e0b]" />
            <span className="text-[20px] font-bold text-[#f59e0b]">{summary.dueToday || 0}</span>
          </div>
          <p className="text-[11px] text-[#f59e0b] mt-1">Due Today</p>
        </div>
        <div className="bg-[rgba(108,140,255,0.1)] border border-[rgba(108,140,255,0.2)] rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#6c8cff]" />
            <span className="text-[20px] font-bold text-[#6c8cff]">{summary.inProgress || 0}</span>
          </div>
          <p className="text-[11px] text-[#6c8cff] mt-1">In Progress</p>
        </div>
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Pause size={16} className="text-[#ef4444]" />
            <span className="text-[20px] font-bold text-[#ef4444]">{summary.blocked || 0}</span>
          </div>
          <p className="text-[11px] text-[#ef4444] mt-1">Blocked</p>
        </div>
      </div>

      {/* Task Sections */}
      <TaskSection
        title="Overdue"
        icon={AlertTriangle}
        tasks={tasks.overdue}
        color="#ef4444"
        openDetail={openDetail}
      />
      <TaskSection
        title="Due Today"
        icon={Calendar}
        tasks={tasks.today}
        color="#f59e0b"
        openDetail={openDetail}
      />
      <TaskSection
        title="In Progress"
        icon={Clock}
        tasks={tasks.inProgress}
        color="#6c8cff"
        openDetail={openDetail}
      />
      <TaskSection
        title="Blocked"
        icon={Pause}
        tasks={tasks.blocked}
        color="#ef4444"
        openDetail={openDetail}
      />
      <TaskSection
        title="Upcoming This Week"
        icon={Calendar}
        tasks={tasks.upcoming}
        color="#8892a4"
        openDetail={openDetail}
      />
      <TaskSection
        title="Not Started"
        icon={Circle}
        tasks={tasks.notStarted}
        color="#556"
        openDetail={openDetail}
      />

      {/* Recently Completed */}
      {tasks.completed?.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[#1e2640]">
          <TaskSection
            title="Recently Completed"
            icon={CheckCircle2}
            tasks={tasks.completed}
            color="#10b981"
            openDetail={openDetail}
          />
        </div>
      )}

      {/* Empty State */}
      {summary.total === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 size={48} className="mx-auto text-[#10b981] mb-4 opacity-50" />
          <h3 className="text-[16px] font-medium text-white mb-2">All caught up!</h3>
          <p className="text-[13px] text-[#8892a4]">You have no tasks assigned to you.</p>
        </div>
      )}
    </div>
  );
}
