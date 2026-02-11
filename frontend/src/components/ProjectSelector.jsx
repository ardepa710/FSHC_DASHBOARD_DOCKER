import { useState } from 'react';
import { FolderKanban, Plus, Settings, Users, LogOut, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { useProjects, useCreateProject, useProjectStats } from '../hooks/useData';

function ProjectCard({ project, onClick }) {
  const { data: stats } = useProjectStats(project.id);

  return (
    <button
      onClick={onClick}
      className="w-full bg-[#1a2035] border border-[#1e2640] rounded-xl p-5 text-left hover:border-[#6c8cff] hover:bg-[#1e2640] transition-all group"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: project.color + '20' }}
        >
          {project.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-[#6c8cff] transition-colors truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-[13px] text-[#8892a4] mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
          {stats && (
            <div className="flex items-center gap-4 mt-3 text-[12px] text-[#556]">
              <span>{stats.totalTasks} tasks</span>
              <span>{stats.completionPercentage}% complete</span>
              {stats.highPriorityTasks > 0 && (
                <span className="text-[#f59e0b]">{stats.highPriorityTasks} high priority</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function CreateProjectModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#6c8cff');
  const createProject = useCreateProject();

  const icons = ['📁', '📊', '🏥', '💼', '🌐', '🚀', '📱', '🎯', '📈', '🔧'];
  const colors = ['#6c8cff', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#14b8a6', '#ef4444'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      await createProject.mutateAsync({ name, description, icon, color });
      toast.success('Project created!');
      onClose();
      setName('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-auto sm:w-[420px] md:w-[480px] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden flex flex-col max-h-[calc(100vh-32px)] sm:max-h-[90vh]">
        <div className="p-3 sm:p-4 border-b border-[#1e2640] shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-white">Create New Project</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
              Name <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name..."
              className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors placeholder:text-[#556]"
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description..."
              rows={2}
              className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors placeholder:text-[#556] resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {icons.map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                      icon === i ? 'bg-[#6c8cff] ring-2 ring-[#6c8cff]/50' : 'bg-[#1a2035] hover:bg-[#1e2640]'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Color
              </label>
              <div className="flex flex-wrap gap-1.5">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg transition-all ${
                      color === c ? 'ring-2 ring-white/50 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 text-[13px] font-semibold text-[#8892a4] hover:text-white transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="px-4 py-2.5 sm:py-2 bg-[#6c8cff] text-white rounded-lg text-[13px] font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function ProjectSelector({ onManageUsers }) {
  const { user, logout, setCurrentProject } = useStore();
  const { data: projects = [], isLoading } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const handleSelectProject = (project) => {
    setCurrentProject(project);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      {/* Header */}
      <header className="border-b border-[#1e2640] bg-[#111827]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#6c8cff] to-[#8b5cf6] rounded-xl flex items-center justify-center">
                <FolderKanban size={18} className="text-white sm:hidden" />
                <FolderKanban size={20} className="text-white hidden sm:block" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-white">Projects</h1>
                <p className="text-[11px] sm:text-[12px] text-[#8892a4]">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={onManageUsers}
                    className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-[13px] font-medium text-[#8892a4] hover:text-white hover:bg-[#1a2035] rounded-lg transition-colors flex items-center justify-center sm:gap-2"
                    title="Manage Users"
                  >
                    <Users size={18} className="sm:hidden" />
                    <Users size={16} className="hidden sm:block" />
                    <span className="hidden sm:inline">Manage Users</span>
                  </button>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-[#6c8cff] text-white rounded-lg text-[13px] font-semibold hover:brightness-110 transition-all flex items-center justify-center sm:gap-2"
                    title="New Project"
                  >
                    <Plus size={18} className="sm:hidden" />
                    <Plus size={16} className="hidden sm:block" />
                    <span className="hidden sm:inline">New Project</span>
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-[13px] font-medium text-[#8892a4] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors flex items-center justify-center sm:gap-2"
                title="Logout"
              >
                <LogOut size={18} className="sm:hidden" />
                <LogOut size={16} className="hidden sm:block" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Projects Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#556] mb-4">
          Your Projects
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#6c8cff]" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <FolderKanban size={48} className="text-[#556] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-[#8892a4] text-[14px]">
              {isAdmin ? 'Create your first project to get started.' : 'You have no projects assigned.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleSelectProject(project)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
