import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Tag, User, Calendar, Filter, Clock } from 'lucide-react';
import { useTasks, usePhases, useTags, useAssignees } from '../hooks/useData';
import useStore from '../store/useStore';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const statusLabels = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const statusColors = {
  NOT_STARTED: 'bg-[var(--text3)]',
  IN_PROGRESS: 'bg-[var(--blue)]',
  BLOCKED: 'bg-[var(--red)]',
  DONE: 'bg-[var(--green)]',
};

export default function GlobalSearch({ isOpen, onClose }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    assignee: null,
    phase: null,
    tag: null,
    hasDate: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recent-searches');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: tasks = [] } = useTasks();
  const { data: phases = [] } = usePhases();
  const { data: tags = [] } = useTags();
  const { data: assignees = [] } = useAssignees();
  const { openDetail } = useStore();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Filter tasks
  const filteredTasks = useCallback(() => {
    if (!query && !filters.status.length && !filters.priority.length && !filters.assignee && !filters.phase && !filters.tag && filters.hasDate === null) {
      return [];
    }

    return tasks.filter((task) => {
      // Text search
      if (query) {
        const searchLower = query.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false;
      }

      // Assignee filter
      if (filters.assignee && task.assigneeId !== filters.assignee) {
        return false;
      }

      // Phase filter
      if (filters.phase && task.phaseId !== filters.phase) {
        return false;
      }

      // Tag filter
      if (filters.tag && !task.tags?.some((t) => t.tagId === filters.tag)) {
        return false;
      }

      // Has due date filter
      if (filters.hasDate === true && !task.dueDate) return false;
      if (filters.hasDate === false && task.dueDate) return false;

      return true;
    });
  }, [tasks, query, filters]);

  const results = filteredTasks();

  const handleSelect = (task) => {
    // Save to recent searches
    const newRecent = [
      { id: task.id, title: task.title },
      ...recentSearches.filter((r) => r.id !== task.id),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recent-searches', JSON.stringify(newRecent));

    openDetail(task.id);
    onClose();
  };

  const toggleFilter = (type, value) => {
    setFilters((prev) => {
      if (type === 'status' || type === 'priority') {
        const arr = prev[type];
        return {
          ...prev,
          [type]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
        };
      }
      return {
        ...prev,
        [type]: prev[type] === value ? null : value,
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      assignee: null,
      phase: null,
      tag: null,
      hasDate: null,
    });
  };

  const hasActiveFilters = filters.status.length > 0 || filters.priority.length > 0 || filters.assignee || filters.phase || filters.tag || filters.hasDate !== null;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[200]" onClick={onClose} />
      <div className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-[600px] max-h-[80vh] bg-[var(--bg1)] border border-[var(--border)] rounded-xl z-[201] overflow-hidden flex flex-col shadow-2xl mx-4">
        {/* Search Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-[var(--bg2)] border border-[var(--border)] rounded-lg py-3 pl-10 pr-10 text-[14px] text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[var(--blue)] outline-none"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)]"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-[background-color,color] ${
                showFilters || hasActiveFilters
                  ? 'bg-[var(--blue)] text-white'
                  : 'bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 bg-white/20 rounded text-[10px]">
                  {filters.status.length + filters.priority.length + (filters.assignee ? 1 : 0) + (filters.phase ? 1 : 0) + (filters.tag ? 1 : 0) + (filters.hasDate !== null ? 1 : 0)}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[12px] text-[var(--text3)] hover:text-[var(--red)]"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-3 p-3 bg-[var(--bg2)] rounded-lg space-y-3">
              {/* Status */}
              <div>
                <p className="text-[10px] text-[var(--text3)] uppercase mb-2">Status</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter('status', key)}
                      className={`px-2 py-1 rounded text-[11px] transition-[background-color,color] ${
                        filters.status.includes(key)
                          ? 'bg-[var(--blue)] text-white'
                          : 'bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <p className="text-[10px] text-[var(--text3)] uppercase mb-2">Priority</p>
                <div className="flex flex-wrap gap-1">
                  {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                    <button
                      key={p}
                      onClick={() => toggleFilter('priority', p)}
                      className={`px-2 py-1 rounded text-[11px] transition-[background-color,color] ${
                        filters.priority.includes(p)
                          ? 'bg-[var(--blue)] text-white'
                          : 'bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee & Phase */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-[var(--text3)] uppercase mb-2">Assignee</p>
                  <select
                    value={filters.assignee || ''}
                    onChange={(e) => toggleFilter('assignee', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded py-1.5 px-2 text-[11px] text-[var(--text)] outline-none"
                  >
                    <option value="">Any</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text3)] uppercase mb-2">Phase</p>
                  <select
                    value={filters.phase || ''}
                    onChange={(e) => toggleFilter('phase', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded py-1.5 px-2 text-[11px] text-[var(--text)] outline-none"
                  >
                    <option value="">Any</option>
                    {phases.map((p) => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {results.slice(0, 20).map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleSelect(task)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(task)}
                  role="button"
                  tabIndex={0}
                  className="p-3 hover:bg-[var(--bg2)] cursor-pointer transition-[background-color]"
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColors[task.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--text)] truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text3)]">
                        {task.phase && (
                          <span>{task.phase.icon} {task.phase.name}</span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {dateFormatter.format(new Date(task.dueDate))}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {task.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      task.priority === 'HIGH' ? 'bg-[var(--red)]/10 text-[var(--red)]' :
                      task.priority === 'MEDIUM' ? 'bg-[var(--amber)]/10 text-[var(--amber)]' :
                      'bg-[var(--bg3)] text-[var(--text3)]'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
              {results.length > 20 && (
                <p className="p-3 text-center text-[12px] text-[var(--text3)]">
                  Showing 20 of {results.length} results
                </p>
              )}
            </div>
          ) : query || hasActiveFilters ? (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto mb-3 text-[var(--text3)] opacity-50" />
              <p className="text-[var(--text2)]">No tasks found</p>
              <p className="text-[12px] text-[var(--text3)]">Try different keywords or filters</p>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="p-4">
              <p className="text-[11px] text-[var(--text3)] uppercase mb-2">Recent</p>
              {recentSearches.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    const task = tasks.find((t) => t.id === item.id);
                    if (task) handleSelect(task);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const task = tasks.find((t) => t.id === item.id);
                      if (task) handleSelect(task);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg2)] cursor-pointer transition-[background-color]"
                >
                  <Clock size={14} className="text-[var(--text3)]" />
                  <span className="text-[13px] text-[var(--text2)]">{item.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto mb-3 text-[var(--text3)] opacity-50" />
              <p className="text-[var(--text2)]">Search for tasks</p>
              <p className="text-[12px] text-[var(--text3)]">Type to search by title or description</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg2)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text3)]">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--bg3)] rounded mr-1">↵</kbd> to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--bg3)] rounded mr-1">esc</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
