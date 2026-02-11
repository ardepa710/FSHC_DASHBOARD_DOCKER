import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { useTasks } from '../hooks/useData';
import useStore from '../store/useStore';
import clsx from 'clsx';

const statusColors = {
  NOT_STARTED: '#556',
  IN_PROGRESS: '#6c8cff',
  BLOCKED: '#ef4444',
  DONE: '#10b981',
};

const priorityColors = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#556',
};

export default function CalendarView() {
  const { openDetail } = useStore();
  const { data: tasks = [] } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const grouped = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="h-full flex flex-col overflow-hidden p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CalendarIcon size={22} className="text-[#6c8cff]" />
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-[12px] text-[#8892a4] hover:text-white border border-[#1e2640] rounded-lg hover:border-[#6c8cff] transition-colors"
          >
            Today
          </button>
          <div className="flex">
            <button
              onClick={goToPrevMonth}
              className="p-2 text-[#8892a4] hover:text-white hover:bg-[#1a2035] rounded-l-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 text-[#8892a4] hover:text-white hover:bg-[#1a2035] rounded-r-lg transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-px bg-[#1e2640] rounded-t-lg overflow-hidden mb-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="bg-[#1a2035] text-center py-2 text-[11px] font-semibold text-[#8892a4] uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-[#1e2640] rounded-b-lg overflow-hidden">
        {calendarDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={clsx(
                'bg-[#111827] min-h-[100px] p-2 flex flex-col',
                !isCurrentMonth && 'opacity-40'
              )}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={clsx(
                    'text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isCurrentDay
                      ? 'bg-[#6c8cff] text-white'
                      : 'text-[#e0e0e0]'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-[#556]">
                    +{dayTasks.length - 3}
                  </span>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayTasks.slice(0, 3).map(task => (
                  <button
                    key={task.id}
                    onClick={() => openDetail(task.id)}
                    className="w-full text-left px-1.5 py-1 rounded text-[10px] truncate hover:brightness-125 transition-all"
                    style={{
                      background: `${statusColors[task.status]}20`,
                      color: statusColors[task.status],
                      borderLeft: `2px solid ${priorityColors[task.priority]}`,
                    }}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-[11px]">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded" style={{ background: color }} />
            <span className="text-[#8892a4]">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
