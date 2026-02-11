import { useState } from 'react';
import { X, Plus, Trash2, Edit2, ArrowLeft, Shield, User as UserIcon, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useAssignUserProjects, useProjects } from '../hooks/useData';

function UserModal({ isOpen, onClose, user, projects }) {
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'USER');
  const [selectedProjects, setSelectedProjects] = useState(
    user?.projects?.map(p => p.id) || []
  );

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const assignProjects = useAssignUserProjects();

  const isEditing = !!user;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!isEditing && !password) {
      toast.error('Password is required');
      return;
    }

    try {
      if (isEditing) {
        await updateUser.mutateAsync({
          id: user.id,
          data: { name, email, role, password: password || undefined }
        });
        await assignProjects.mutateAsync({
          id: user.id,
          projectIds: selectedProjects
        });
        toast.success('User updated!');
      } else {
        await createUser.mutateAsync({
          username,
          password,
          name,
          email,
          role,
          projectIds: selectedProjects
        });
        toast.success('User created!');
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  const toggleProject = (projectId) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-auto sm:w-[460px] md:w-[520px] max-h-[calc(100vh-32px)] sm:max-h-[90vh] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden flex flex-col">
        <div className="p-3 sm:p-4 border-b border-[#1e2640] flex items-center justify-between shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-md bg-[#1a2035] border border-[#1e2640] text-[#8892a4] hover:text-white hover:border-[#6c8cff] flex items-center justify-center transition-all">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Name <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Username <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isEditing}
                className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Password {!isEditing && <span className="text-[#ef4444]">*</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Leave blank to keep' : ''}
                className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors placeholder:text-[#556]"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
              Role
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-all ${
                  role === 'USER'
                    ? 'bg-[#6c8cff] text-white'
                    : 'bg-[#1a2035] border border-[#1e2640] text-[#8892a4] hover:border-[#6c8cff]'
                }`}
              >
                <UserIcon size={16} />
                User
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-all ${
                  role === 'ADMIN'
                    ? 'bg-[#8b5cf6] text-white'
                    : 'bg-[#1a2035] border border-[#1e2640] text-[#8892a4] hover:border-[#8b5cf6]'
                }`}
              >
                <Shield size={16} />
                Admin
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
              Assign to Projects
            </label>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {projects?.map(project => (
                <label
                  key={project.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedProjects.includes(project.id)
                      ? 'bg-[#6c8cff]/10 border border-[#6c8cff]/30'
                      : 'bg-[#1a2035] border border-[#1e2640] hover:border-[#6c8cff]/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                    className="w-4 h-4 rounded border-[#1e2640] bg-[#1a2035] text-[#6c8cff] focus:ring-[#6c8cff]"
                  />
                  <span className="text-lg">{project.icon}</span>
                  <span className="text-[13px] text-[#e0e0e0]">{project.name}</span>
                </label>
              ))}
            </div>
          </div>
        </form>

        <div className="p-3 sm:p-4 border-t border-[#1e2640] flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 sm:py-2 text-[13px] font-semibold text-[#8892a4] hover:text-white transition-colors text-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createUser.isPending || updateUser.isPending}
            className="px-4 py-2.5 sm:py-2 bg-[#6c8cff] text-white rounded-lg text-[13px] font-semibold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {createUser.isPending || updateUser.isPending ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
          </button>
        </div>
      </div>
    </>
  );
}

export default function UserManagement({ onBack }) {
  const { data: users = [], isLoading } = useUsers();
  const { data: projects = [] } = useProjects();
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteUser = useDeleteUser();

  const handleDelete = async (user) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;

    try {
      await deleteUser.mutateAsync(user.id);
      toast.success('User deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      {/* Header */}
      <header className="border-b border-[#1e2640] bg-[#111827]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1a2035] border border-[#1e2640] flex items-center justify-center text-[#8892a4] hover:text-white hover:border-[#6c8cff] transition-all"
            >
              <ArrowLeft size={18} className="sm:hidden" />
              <ArrowLeft size={20} className="hidden sm:block" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-white">User Management</h1>
              <p className="text-[11px] sm:text-[12px] text-[#8892a4]">{users.length} users</p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-[#6c8cff] text-white rounded-lg text-[13px] font-semibold hover:brightness-110 transition-all flex items-center justify-center sm:gap-2"
            title="New User"
          >
            <Plus size={18} className="sm:hidden" />
            <Plus size={16} className="hidden sm:block" />
            <span className="hidden sm:inline">New User</span>
          </button>
        </div>
      </header>

      {/* Users List */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="text-center py-20 text-[#8892a4]">Loading...</div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div
                key={user.id}
                className="bg-[#1a2035] border border-[#1e2640] rounded-xl p-3 sm:p-4"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-semibold text-[12px] sm:text-[14px] shrink-0 ${
                    user.role === 'ADMIN' ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6c8cff]' : 'bg-[#1e2640]'
                  }`}>
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-[14px] sm:text-[15px]">{user.name}</h3>
                      {user.role === 'ADMIN' && (
                        <span className="px-2 py-0.5 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded text-[10px] font-semibold uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-[#8892a4]">@{user.username}</p>
                    {user.projects?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                        <FolderKanban size={12} className="text-[#556] shrink-0" />
                        <span className="text-[11px] sm:text-[12px] text-[#556] truncate">
                          {user.projects.map(p => p.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(user)}
                      className="w-8 h-8 rounded-lg bg-[#1e2640] border border-[#1e2640] text-[#8892a4] hover:text-white hover:border-[#6c8cff] flex items-center justify-center transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deleteUser.isPending}
                      className="w-8 h-8 rounded-lg bg-[#1e2640] border border-[#1e2640] text-[#8892a4] hover:text-[#ef4444] hover:border-[#ef4444] flex items-center justify-center transition-all disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        projects={projects}
      />
    </div>
  );
}
