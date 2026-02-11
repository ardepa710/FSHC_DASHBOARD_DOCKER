import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useTasks, usePhases } from '../hooks/useData';
import useStore from '../store/useStore';

const statusColors = {
  NOT_STARTED: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  BLOCKED: '#ef4444',
  DONE: '#10b981',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

export default function GanttView() {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1); // 1 = day view, 0.5 = week view, 2 = detailed
  const [scrollOffset, setScrollOffset] = useState(0);

  const { currentPhaseFilter, statusFilters, searchQuery, openDetail } = useStore();
  const { data: tasks = [] } = useTasks();
  const { data: phases = [] } = usePhases();

  // Calculate date range from tasks
  const { startDate, endDate, dayWidth, totalDays } = useMemo(() => {
    const tasksWithDates = tasks.filter(t => t.startDate || t.dueDate);
    if (tasksWithDates.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      return {
        startDate: start,
        endDate: end,
        dayWidth: 40 * zoom,
        totalDays: 37,
      };
    }

    let minDate = new Date();
    let maxDate = new Date();

    tasksWithDates.forEach(task => {
      const start = task.startDate ? new Date(task.startDate) : null;
      const due = task.dueDate ? new Date(task.dueDate) : null;

      if (start && start < minDate) minDate = new Date(start);
      if (due && due > maxDate) maxDate = new Date(due);
      if (start && start > maxDate) maxDate = new Date(start);
      if (due && due < minDate) minDate = new Date(due);
    });

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);

    const days = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    return {
      startDate: minDate,
      endDate: maxDate,
      dayWidth: 40 * zoom,
      totalDays: days,
    };
  }, [tasks, zoom]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (currentPhaseFilter !== 'all' && task.phaseId !== parseInt(currentPhaseFilter)) {
        return false;
      }
      if (!statusFilters.includes(task.status)) {
        return false;
      }
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tasks, currentPhaseFilter, statusFilters, searchQuery]);

  // Group by phase
  const groupedTasks = useMemo(() => {
    const groups = {};
    filteredTasks.forEach(task => {
      const phase = phases.find(p => p.id === task.phaseId);
      const phaseName = phase?.name || 'No Phase';
      if (!groups[phaseName]) {
        groups[phaseName] = { phase, tasks: [] };
      }
      groups[phaseName].tasks.push(task);
    });
    return Object.values(groups);
  }, [filteredTasks, phases]);

  // Generate date headers
  const dateHeaders = useMemo(() => {
    const headers = [];
    const months = {};

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!months[monthKey]) {
        months[monthKey] = { date: new Date(date), startIndex: i, count: 0 };
      }
      months[monthKey].count++;

      headers.push({
        date,
        dayOfWeek: date.getDay(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: isSameDay(date, new Date()),
      });
    }

    return { days: headers, months: Object.values(months) };
  }, [startDate, totalDays]);

  const getTaskPosition = (task) => {
    const start = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : null;
    const end = task.dueDate ? new Date(task.dueDate) : task.startDate ? new Date(task.startDate) : null;

    if (!start && !end) return null;

    const startOffset = Math.max(0, Math.floor((start - startDate) / (1000 * 60 * 60 * 24)));
    const endOffset = Math.floor((end - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const width = Math.max(1, endOffset - startOffset);

    return {
      left: startOffset * dayWidth,
      width: width * dayWidth - 4,
    };
  };

  const handleScroll = (direction) => {
    const newOffset = scrollOffset + (direction === 'left' ? -200 : 200);
    setScrollOffset(Math.max(0, newOffset));
    if (containerRef.current) {
      containerRef.current.scrollLeft = Math.max(0, newOffset);
    }
  };

  const handleZoom = (direction) => {
    setZoom(prev => {
      if (direction === 'in') return Math.min(2, prev + 0.25);
      return Math.max(0.5, prev - 0.25);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-[#111827] border-b border-[#1e2640]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 text-[#8892a4] hover:text-white hover:bg-[#253050] rounded transition-[color,background-color]"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 text-[#8892a4] hover:text-white hover:bg-[#253050] rounded transition-[color,background-color]"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom('out')}
            className="p-1.5 text-[#8892a4] hover:text-white hover:bg-[#253050] rounded transition-[color,background-color]"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-[12px] text-[#8892a4] w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => handleZoom('in')}
            className="p-1.5 text-[#8892a4] hover:text-white hover:bg-[#253050] rounded transition-[color,background-color]"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-hidden flex">
        {/* Task list sidebar */}
        <div className="w-64 shrink-0 border-r border-[#1e2640] overflow-y-auto bg-[#111827]">
          {/* Header */}
          <div className="h-16 border-b border-[#1e2640] flex items-center px-4">
            <span className="text-[12px] font-semibold text-white">Tasks</span>
          </div>

          {/* Task rows */}
          {groupedTasks.map((group, groupIdx) => (
            <div key={groupIdx}>
              {/* Phase header */}
              <div className="h-8 bg-[#1a2035] border-b border-[#1e2640] flex items-center px-4">
                <span className="text-[11px] font-medium text-[#6c8cff]">
                  {group.phase?.icon} {group.phase?.name || 'No Phase'}
                </span>
              </div>
              {/* Tasks */}
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => openDetail(task.id)}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail(task.id)}
                  role="button"
                  tabIndex={0}
                  className="h-10 border-b border-[#1e2640] flex items-center px-4 hover:bg-[#1a2035] cursor-pointer transition-[background-color]"
                >
                  <span className="text-[12px] text-[#e0e0e0] truncate">{task.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Timeline area */}
        <div ref={containerRef} className="flex-1 overflow-auto">
          <div style={{ width: totalDays * dayWidth, minWidth: '100%' }}>
            {/* Month headers */}
            <div className="h-8 border-b border-[#1e2640] flex bg-[#111827] sticky top-0 z-10">
              {dateHeaders.months.map((month, idx) => (
                <div
                  key={idx}
                  style={{ left: month.startIndex * dayWidth, width: month.count * dayWidth }}
                  className="border-r border-[#1e2640] flex items-center justify-center"
                >
                  <span className="text-[11px] text-[#8892a4]">
                    {monthFormatter.format(month.date)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day headers */}
            <div className="h-8 border-b border-[#1e2640] flex bg-[#111827] sticky top-8 z-10">
              {dateHeaders.days.map((day, idx) => (
                <div
                  key={idx}
                  style={{ width: dayWidth }}
                  className={`shrink-0 border-r border-[#1e2640] flex items-center justify-center ${
                    day.isToday ? 'bg-[rgba(108,140,255,0.2)]' : day.isWeekend ? 'bg-[rgba(0,0,0,0.2)]' : ''
                  }`}
                >
                  <span className={`text-[10px] ${day.isToday ? 'text-[#6c8cff] font-semibold' : 'text-[#556]'}`}>
                    {dateFormatter.format(day.date)}
                  </span>
                </div>
              ))}
            </div>

            {/* Task bars */}
            {groupedTasks.map((group, groupIdx) => (
              <div key={groupIdx}>
                {/* Phase spacer */}
                <div className="h-8 border-b border-[#1e2640] bg-[#1a2035]" />
                {/* Task rows */}
                {group.tasks.map((task) => {
                  const position = getTaskPosition(task);
                  return (
                    <div
                      key={task.id}
                      className="h-10 border-b border-[#1e2640] relative"
                    >
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {dateHeaders.days.map((day, idx) => (
                          <div
                            key={idx}
                            style={{ width: dayWidth }}
                            className={`shrink-0 border-r border-[#1e2640]/30 ${
                              day.isToday ? 'bg-[rgba(108,140,255,0.1)]' : day.isWeekend ? 'bg-[rgba(0,0,0,0.1)]' : ''
                            }`}
                          />
                        ))}
                      </div>
                      {/* Task bar */}
                      {position && (
                        <div
                          onClick={() => openDetail(task.id)}
                          onKeyDown={(e) => e.key === 'Enter' && openDetail(task.id)}
                          role="button"
                          tabIndex={0}
                          style={{
                            left: position.left + 2,
                            width: position.width,
                            backgroundColor: statusColors[task.status],
                          }}
                          className="absolute top-1.5 h-7 rounded cursor-pointer hover:brightness-110 transition-[filter] flex items-center px-2 overflow-hidden"
                        >
                          <span className="text-[10px] text-white font-medium truncate">
                            {task.title}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {groupedTasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#8892a4] text-[14px]">No tasks with dates</p>
            <p className="text-[#556] text-[12px] mt-1">Add start dates or due dates to see tasks here</p>
          </div>
        </div>
      )}
    </div>
  );
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
