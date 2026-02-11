import { Search, SlidersHorizontal, Plus, Menu, LayoutList, Columns3, Calendar, CirclePlay } from 'lucide-react';
import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { usePhases } from '../hooks/useData';
import { NotificationBell } from './NotificationsPanel';
import FilterPresetsDropdown from './FilterPresetsDropdown';
import OnlineUsers from './OnlineUsers';
import TutorialModal from './TutorialModal';

export default function TopBar({ onMenuClick }) {
  const {
    currentView,
    setCurrentView,
    currentPhaseFilter,
    searchQuery,
    setSearchQuery,
    statusFilters,
    toggleStatusFilter,
    openCreateModal,
  } = useStore();

  const { data: phases } = usePhases();
  const [showFilters, setShowFilters] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const currentPhase = phases?.find((p) => p.id === currentPhaseFilter);
  const title = currentPhaseFilter === 'all' ? 'All Tasks' : currentPhase?.name || 'Tasks';

  const views = [
    { id: 'list', label: 'List', icon: LayoutList },
    { id: 'board', label: 'Board', icon: Columns3 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
  ];

  const statuses = [
    { key: 'NOT_STARTED', label: 'Not Started' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'BLOCKED', label: 'Blocked' },
    { key: 'DONE', label: 'Done' },
  ];

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.filter-container')) {
        setShowFilters(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#1e2640] bg-[#111827] shrink-0">
      {/* Mobile: Title row */}
      <div className="flex items-center gap-3 lg:hidden mb-3">
        <button
          onClick={onMenuClick}
          className="w-9 h-9 rounded-lg bg-[#1a2035] border border-[#1e2640] text-[#8892a4] hover:text-white flex items-center justify-center"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-base font-bold text-white flex-1 truncate">{title}</h2>
        <button
          onClick={openCreateModal}
          className="w-9 h-9 rounded-lg bg-[#6c8cff] text-white flex items-center justify-center hover:brightness-110 transition-[filter]"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Desktop: Full header / Mobile: Secondary row */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Title - Desktop only */}
        <h2 className="hidden lg:block text-lg font-bold text-white whitespace-nowrap">{title}</h2>

        {/* View tabs */}
        <div className="flex bg-[#1a2035] rounded-lg p-1 gap-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setCurrentView(view.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-semibold rounded-md transition-[background-color,color] flex items-center gap-1.5 ${
                currentView === view.id
                  ? 'bg-[#253050] text-white'
                  : 'text-[#8892a4] hover:text-white'
              }`}
            >
              <view.icon size={14} className="sm:hidden" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search - Hidden on very small screens */}
        <div className="relative hidden sm:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556]"
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-search-input
            className="bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 pl-9 pr-3 text-[12px] text-[#e0e0e0] w-[160px] md:w-[200px] lg:w-[240px] outline-none focus:border-[#6c8cff] transition-[border-color] placeholder:text-[#556]"
          />
        </div>

        {/* Filter Presets */}
        <FilterPresetsDropdown />

        {/* Filter */}
        <div className="relative filter-container">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 bg-[#1a2035] border border-[#1e2640] rounded-lg px-3 py-2 text-[12px] text-[#8892a4] hover:border-[#6c8cff] hover:text-white transition-[border-color,color]"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {showFilters && (
            <div className="absolute top-full right-0 mt-2 bg-[#111827] border border-[#1e2640] rounded-lg p-2 min-w-[180px] z-50 shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#556] px-2 pb-2">
                Status
              </p>
              {statuses.map((status) => (
                <label
                  key={status.key}
                  className="flex items-center gap-2.5 px-2 py-2 text-[12px] text-[#8892a4] hover:bg-[#1a2035] hover:text-white rounded-md cursor-pointer transition-[background-color,color]"
                >
                  <input
                    type="checkbox"
                    checked={statusFilters.includes(status.key)}
                    onChange={() => toggleStatusFilter(status.key)}
                    className="w-4 h-4 rounded border-[#1e2640] bg-[#1a2035] text-[#6c8cff] focus:ring-[#6c8cff] focus:ring-offset-0"
                  />
                  {status.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Online Users */}
        <OnlineUsers />

        {/* Tutorial Video */}
        <button
          onClick={() => setShowTutorial(true)}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#1a2035] border border-[#1e2640] text-[#8892a4] hover:text-[#6c8cff] hover:border-[#6c8cff] transition-colors"
          title="Watch Tutorial"
        >
          <CirclePlay size={18} />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Create Task Button - Desktop only */}
        <button
          onClick={openCreateModal}
          className="hidden lg:flex items-center gap-2 bg-[#6c8cff] text-white rounded-lg px-4 py-2 text-[12px] font-semibold hover:brightness-110 transition-[filter]"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Mobile search - Full width */}
      <div className="relative sm:hidden mt-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556]"
        />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-search-input
          className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2.5 pl-9 pr-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-[border-color] placeholder:text-[#556]"
        />
      </div>

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </header>
  );
}
