import { LayoutList, Columns3, Calendar, Circle, ChevronLeft, LogOut, X } from 'lucide-react';
import useStore from '../store/useStore';
import { usePhases, useProjectStats } from '../hooks/useData';
import toast from 'react-hot-toast';

export default function Sidebar({ onClose }) {
  const {
    currentView,
    setCurrentView,
    currentPhaseFilter,
    setPhaseFilter,
    currentProject,
    setCurrentProject,
    user,
    logout
  } = useStore();

  const { data: phases = [] } = usePhases();
  const { data: stats } = useProjectStats(currentProject?.id);

  const views = [
    { id: 'list', label: 'List', icon: LayoutList },
    { id: 'board', label: 'Board', icon: Columns3 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
  ];

  const totalTasks = phases.reduce((sum, p) => sum + (p._count?.tasks || 0), 0);

  const handleBackToProjects = () => {
    setCurrentProject(null);
    setPhaseFilter('all');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
  };

  const handleViewChange = (viewId) => {
    setCurrentView(viewId);
    onClose?.();
  };

  const handlePhaseChange = (phaseId) => {
    setPhaseFilter(phaseId);
    onClose?.();
  };

  return (
    <aside className="w-[280px] sm:w-[260px] bg-[#111827] border-r border-[#1e2640] flex flex-col h-screen">
      {/* Project Header */}
      <div className="p-4 border-b border-[#1e2640]">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleBackToProjects}
            className="flex items-center gap-2 text-[12px] text-[#8892a4] hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
            All Projects
          </button>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg bg-[#1a2035] text-[#8892a4] hover:text-white flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: currentProject?.color + '20' }}
          >
            {currentProject?.icon || '📁'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[14px] font-bold text-white truncate">
              {currentProject?.name || 'Project'}
            </h1>
            {stats && (
              <p className="text-[11px] text-[#8892a4]">
                {stats.completionPercentage}% complete
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Views */}
      <div className="px-3 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#556] px-2 mb-2">
          Views
        </p>
        <div className="space-y-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => handleViewChange(view.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all ${
                currentView === view.id
                  ? 'bg-[rgba(108,140,255,0.12)] text-[#6c8cff] font-semibold'
                  : 'text-[#8892a4] hover:bg-[#1a2035] hover:text-white'
              }`}
            >
              <view.icon size={18} />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Phases */}
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#556] px-2 mb-2">
          Phases
        </p>
        <div className="space-y-1">
          <button
            onClick={() => handlePhaseChange('all')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all ${
              currentPhaseFilter === 'all'
                ? 'bg-[rgba(108,140,255,0.12)] text-[#6c8cff] font-semibold'
                : 'text-[#8892a4] hover:bg-[#1a2035] hover:text-white'
            }`}
          >
            <Circle size={10} fill="currentColor" className="shrink-0" />
            <span className="flex-1 text-left">All Phases</span>
            <span className="bg-[#253050] text-[#8892a4] text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {totalTasks}
            </span>
          </button>

          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => handlePhaseChange(phase.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all ${
                currentPhaseFilter === phase.id
                  ? 'bg-[rgba(108,140,255,0.12)] text-[#6c8cff] font-semibold'
                  : 'text-[#8892a4] hover:bg-[#1a2035] hover:text-white'
              }`}
            >
              <span className="shrink-0" style={{ color: phase.color }}>{phase.icon}</span>
              <span className="flex-1 text-left truncate">{phase.name}</span>
              <span className="bg-[#253050] text-[#8892a4] text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                {phase._count?.tasks || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      {stats && (
        <div className="p-4 border-t border-[#1e2640]">
          <div className="flex justify-between text-[11px] text-[#8892a4] mb-2">
            <span>Overall Progress</span>
            <span>{stats.completionPercentage}%</span>
          </div>
          <div className="h-1.5 bg-[#253050] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6c8cff] to-[#8b5cf6] rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-[#556] mt-3">
            <div className="text-center">
              <span className="block text-[#10b981] font-semibold">{stats.doneTasks}</span>
              done
            </div>
            <div className="text-center">
              <span className="block text-[#6c8cff] font-semibold">{stats.inProgressTasks}</span>
              in progress
            </div>
            <div className="text-center">
              <span className="block text-[#ef4444] font-semibold">{stats.blockedTasks}</span>
              blocked
            </div>
          </div>
        </div>
      )}

      {/* User */}
      <div className="p-4 border-t border-[#1e2640]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 ${
            user?.role === 'ADMIN'
              ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6c8cff]'
              : 'bg-gradient-to-br from-[#6c8cff] to-[#8b5cf6]'
          }`}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-white font-semibold truncate">{user?.name}</p>
            <p className="text-[11px] text-[#556]">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Member'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-[#1a2035] text-[#8892a4] hover:text-[#ef4444] hover:bg-[#ef4444]/10 flex items-center justify-center transition-all shrink-0"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
