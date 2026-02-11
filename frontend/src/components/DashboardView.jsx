import { useState } from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Plus,
  GripVertical,
  X,
  Settings,
} from 'lucide-react';
import {
  useProjectStats,
  useTasks,
  useProjectOverview,
  useWorkload,
  useTrend,
  useMyTasks,
} from '../hooks/useData';
import useStore from '../store/useStore';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

// Widget Components
function StatsWidget() {
  const { currentProject } = useStore();
  const { data: stats } = useProjectStats(currentProject?.id);

  if (!stats) return <WidgetSkeleton />;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Total Tasks"
        value={stats.totalTasks}
        icon={Target}
        color="blue"
      />
      <StatCard
        label="Completed"
        value={stats.doneTasks}
        icon={CheckCircle2}
        color="green"
      />
      <StatCard
        label="In Progress"
        value={stats.inProgressTasks}
        icon={Clock}
        color="amber"
      />
      <StatCard
        label="Blocked"
        value={stats.blockedTasks}
        icon={AlertTriangle}
        color="red"
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue: 'text-[var(--blue)] bg-[var(--blue)]/10',
    green: 'text-[var(--green)] bg-[var(--green)]/10',
    amber: 'text-[var(--amber)] bg-[var(--amber)]/10',
    red: 'text-[var(--red)] bg-[var(--red)]/10',
  };

  return (
    <div className="bg-[var(--bg2)] rounded-lg p-3 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[20px] font-bold text-[var(--text)]">{value}</p>
        <p className="text-[11px] text-[var(--text2)]">{label}</p>
      </div>
    </div>
  );
}

function ProgressWidget() {
  const { currentProject } = useStore();
  const { data: stats } = useProjectStats(currentProject?.id);

  if (!stats) return <WidgetSkeleton />;

  const percentage = stats.completionPercentage || 0;

  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="var(--bg3)"
            strokeWidth="12"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="var(--blue)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 3.52} 352`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[28px] font-bold text-[var(--text)]">{percentage}%</span>
        </div>
      </div>
      <p className="text-[13px] text-[var(--text2)]">Project Completion</p>
    </div>
  );
}

function RecentTasksWidget() {
  const { data: tasks = [] } = useTasks();
  const { openDetail } = useStore();

  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const statusColors = {
    NOT_STARTED: 'bg-[var(--text3)]',
    IN_PROGRESS: 'bg-[var(--blue)]',
    BLOCKED: 'bg-[var(--red)]',
    DONE: 'bg-[var(--green)]',
  };

  return (
    <div className="space-y-2">
      {recentTasks.length === 0 ? (
        <p className="text-[var(--text3)] text-[12px] text-center py-4">No tasks yet</p>
      ) : (
        recentTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => openDetail(task.id)}
            onKeyDown={(e) => e.key === 'Enter' && openDetail(task.id)}
            role="button"
            tabIndex={0}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg3)] cursor-pointer transition-[background-color]"
          >
            <span className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
            <span className="flex-1 text-[12px] text-[var(--text)] truncate">{task.title}</span>
            {task.dueDate && (
              <span className="text-[10px] text-[var(--text3)]">
                {dateFormatter.format(new Date(task.dueDate))}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function UpcomingDeadlinesWidget() {
  const { data: tasks = [] } = useTasks();
  const { openDetail } = useStore();

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcoming = tasks
    .filter((t) => {
      if (!t.dueDate || t.status === 'DONE') return false;
      const due = new Date(t.dueDate);
      return due >= today && due <= nextWeek;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const isOverdue = (date) => new Date(date) < today;
  const isToday = (date) => {
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-2">
      {upcoming.length === 0 ? (
        <p className="text-[var(--text3)] text-[12px] text-center py-4">No upcoming deadlines</p>
      ) : (
        upcoming.map((task) => (
          <div
            key={task.id}
            onClick={() => openDetail(task.id)}
            onKeyDown={(e) => e.key === 'Enter' && openDetail(task.id)}
            role="button"
            tabIndex={0}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg3)] cursor-pointer transition-[background-color]"
          >
            <Calendar size={14} className="text-[var(--text3)] shrink-0" />
            <span className="flex-1 text-[12px] text-[var(--text)] truncate">{task.title}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded ${
                isOverdue(task.dueDate)
                  ? 'bg-[var(--red)]/10 text-[var(--red)]'
                  : isToday(task.dueDate)
                  ? 'bg-[var(--amber)]/10 text-[var(--amber)]'
                  : 'bg-[var(--bg3)] text-[var(--text2)]'
              }`}
            >
              {isToday(task.dueDate) ? 'Today' : dateFormatter.format(new Date(task.dueDate))}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function WorkloadWidget() {
  const { currentProject } = useStore();
  const { data: workload = [] } = useWorkload();

  if (workload.length === 0) {
    return <p className="text-[var(--text3)] text-[12px] text-center py-4">No assignees</p>;
  }

  const maxTasks = Math.max(...workload.map((w) => w.totalTasks || 0), 1);

  return (
    <div className="space-y-3">
      {workload.slice(0, 5).map((assignee) => (
        <div key={assignee.id} className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ backgroundColor: assignee.color || 'var(--blue)' }}
          >
            {assignee.initials || assignee.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[var(--text)] truncate">{assignee.name}</p>
            <div className="h-1.5 bg-[var(--bg3)] rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-[var(--blue)] rounded-full transition-[width]"
                style={{ width: `${((assignee.totalTasks || 0) / maxTasks) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-[var(--text2)] shrink-0">{assignee.totalTasks || 0}</span>
        </div>
      ))}
    </div>
  );
}

function MyTasksWidget() {
  const { data: myTasks } = useMyTasks();
  const { openDetail } = useStore();

  const tasks = myTasks?.assignedToMe?.slice(0, 5) || [];

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <p className="text-[var(--text3)] text-[12px] text-center py-4">No tasks assigned</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => openDetail(task.id)}
            onKeyDown={(e) => e.key === 'Enter' && openDetail(task.id)}
            role="button"
            tabIndex={0}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg3)] cursor-pointer transition-[background-color]"
          >
            <span className="flex-1 text-[12px] text-[var(--text)] truncate">{task.title}</span>
          </div>
        ))
      )}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-[var(--bg3)] rounded w-3/4" />
      <div className="h-4 bg-[var(--bg3)] rounded w-1/2" />
      <div className="h-4 bg-[var(--bg3)] rounded w-2/3" />
    </div>
  );
}

// Widget Configuration
const availableWidgets = [
  { id: 'stats', title: 'Project Stats', component: StatsWidget, size: 'large' },
  { id: 'progress', title: 'Progress', component: ProgressWidget, size: 'small' },
  { id: 'recent', title: 'Recent Tasks', component: RecentTasksWidget, size: 'medium' },
  { id: 'deadlines', title: 'Upcoming Deadlines', component: UpcomingDeadlinesWidget, size: 'medium' },
  { id: 'workload', title: 'Team Workload', component: WorkloadWidget, size: 'medium' },
  { id: 'mytasks', title: 'My Tasks', component: MyTasksWidget, size: 'medium' },
];

const defaultLayout = ['stats', 'progress', 'deadlines', 'recent', 'workload', 'mytasks'];

export default function DashboardView() {
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('dashboard-layout');
    return saved ? JSON.parse(saved) : defaultLayout;
  });
  const [isEditing, setIsEditing] = useState(false);

  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
  };

  const removeWidget = (widgetId) => {
    saveLayout(layout.filter((id) => id !== widgetId));
  };

  const addWidget = (widgetId) => {
    if (!layout.includes(widgetId)) {
      saveLayout([...layout, widgetId]);
    }
  };

  const unusedWidgets = availableWidgets.filter((w) => !layout.includes(w.id));

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[18px] sm:text-[20px] font-bold text-[var(--text)] flex items-center gap-2">
          <LayoutDashboard size={22} className="text-[var(--blue)]" />
          Dashboard
        </h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-1.5 transition-[background-color,color] ${
            isEditing
              ? 'bg-[var(--blue)] text-white'
              : 'bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)]'
          }`}
        >
          <Settings size={14} />
          {isEditing ? 'Done' : 'Customize'}
        </button>
      </div>

      {/* Add Widget Section */}
      {isEditing && unusedWidgets.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--bg2)] border border-dashed border-[var(--border)] rounded-xl">
          <p className="text-[12px] text-[var(--text2)] mb-3">Add widgets:</p>
          <div className="flex flex-wrap gap-2">
            {unusedWidgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => addWidget(widget.id)}
                className="px-3 py-1.5 bg-[var(--bg3)] text-[var(--text2)] rounded-lg text-[12px] hover:bg-[var(--blue)] hover:text-white transition-[background-color,color] flex items-center gap-1"
              >
                <Plus size={12} />
                {widget.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {layout.map((widgetId) => {
          const widget = availableWidgets.find((w) => w.id === widgetId);
          if (!widget) return null;

          const Widget = widget.component;
          const colSpan =
            widget.size === 'large'
              ? 'sm:col-span-2'
              : widget.size === 'small'
              ? ''
              : '';

          return (
            <div
              key={widget.id}
              className={`bg-[var(--bg1)] border border-[var(--border)] rounded-xl p-4 ${colSpan} ${
                isEditing ? 'ring-2 ring-[var(--blue)]/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[var(--text)]">{widget.title}</h3>
                {isEditing && (
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="p-1 text-[var(--text3)] hover:text-[var(--red)] transition-[color]"
                    aria-label={`Remove ${widget.title}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <Widget />
            </div>
          );
        })}
      </div>

      {layout.length === 0 && (
        <div className="text-center py-12">
          <LayoutDashboard size={48} className="mx-auto mb-4 text-[var(--text3)] opacity-50" />
          <p className="text-[var(--text2)]">No widgets added</p>
          <p className="text-[12px] text-[var(--text3)]">Click "Customize" to add widgets</p>
        </div>
      )}
    </div>
  );
}
