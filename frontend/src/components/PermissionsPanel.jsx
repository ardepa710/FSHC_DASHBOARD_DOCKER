import { useState } from 'react';
import { X, Shield, ChevronDown, RotateCcw, Save, Eye, EyeOff, Check } from 'lucide-react';
import { useAllProjectPermissions, useUpdateUserPermissions, useResetUserPermissions, usePhases } from '../hooks/useData';
import useStore from '../store/useStore';

const permissionLabels = {
  canCreateTasks: { label: 'Create Tasks', description: 'Can create new tasks in the project' },
  canEditTasks: { label: 'Edit Tasks', description: 'Can modify existing tasks' },
  canDeleteTasks: { label: 'Delete Tasks', description: 'Can permanently remove tasks' },
  canAssignTasks: { label: 'Assign Tasks', description: 'Can assign tasks to team members' },
  canManagePhases: { label: 'Manage Phases', description: 'Can create, edit, and delete phases' },
  canManageTeam: { label: 'Manage Team', description: 'Can add or remove team members' },
  canManageProject: { label: 'Manage Project', description: 'Can edit project settings' },
};

const roleColors = {
  OWNER: 'bg-purple-500/20 text-purple-400',
  MEMBER: 'bg-blue-500/20 text-blue-400',
  VIEWER: 'bg-gray-500/20 text-gray-400',
};

export default function PermissionsPanel({ isOpen, onClose }) {
  const { currentProject, user } = useStore();
  const { data: permissionsData, isLoading } = useAllProjectPermissions();
  const { data: phases } = usePhases();
  const updatePermissions = useUpdateUserPermissions();
  const resetPermissions = useResetUserPermissions();

  const [expandedUser, setExpandedUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleTogglePermission = (userId, permission) => {
    setEditingPermissions(prev => {
      const userPerms = prev[userId] || {};
      return {
        ...prev,
        [userId]: {
          ...userPerms,
          [permission]: userPerms[permission] !== undefined
            ? !userPerms[permission]
            : !permissionsData?.find(p => p.user.id === userId)?.permissions[permission]
        }
      };
    });
  };

  const handleTogglePhaseVisibility = (userId, phaseId) => {
    setEditingPermissions(prev => {
      const userPerms = prev[userId] || {};
      const currentVisible = userPerms.visiblePhases !== undefined
        ? userPerms.visiblePhases
        : permissionsData?.find(p => p.user.id === userId)?.permissions.visiblePhases;

      let newVisible;
      if (currentVisible === null) {
        // Was all visible, now restrict to all except this one
        newVisible = phases?.filter(p => p.id !== phaseId).map(p => p.id) || [];
      } else if (currentVisible.includes(phaseId)) {
        // Remove this phase
        newVisible = currentVisible.filter(id => id !== phaseId);
        if (newVisible.length === phases?.length) newVisible = null;
      } else {
        // Add this phase
        newVisible = [...currentVisible, phaseId];
        if (newVisible.length === phases?.length) newVisible = null;
      }

      return {
        ...prev,
        [userId]: {
          ...userPerms,
          visiblePhases: newVisible
        }
      };
    });
  };

  const getEffectivePermission = (userId, permission) => {
    if (editingPermissions[userId]?.[permission] !== undefined) {
      return editingPermissions[userId][permission];
    }
    return permissionsData?.find(p => p.user.id === userId)?.permissions[permission];
  };

  const getVisiblePhases = (userId) => {
    if (editingPermissions[userId]?.visiblePhases !== undefined) {
      return editingPermissions[userId].visiblePhases;
    }
    return permissionsData?.find(p => p.user.id === userId)?.permissions.visiblePhases;
  };

  const handleSave = async (userId) => {
    if (!editingPermissions[userId]) return;

    setSaving(true);
    try {
      await updatePermissions.mutateAsync({
        userId,
        data: editingPermissions[userId]
      });
      setEditingPermissions(prev => {
        const { [userId]: removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Failed to update permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (userId) => {
    setSaving(true);
    try {
      await resetPermissions.mutateAsync(userId);
      setEditingPermissions(prev => {
        const { [userId]: removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Failed to reset permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = (userId) => {
    return editingPermissions[userId] && Object.keys(editingPermissions[userId]).length > 0;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div
        className="bg-[var(--bg1)] border border-[var(--border)] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Shield size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Team Permissions</h2>
              <p className="text-xs text-[var(--text-muted)]">{currentProject?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--bg2)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#6c8cff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : permissionsData?.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              No team members in this project
            </div>
          ) : (
            permissionsData?.map(({ user: member, role, permissions, isCustom }) => {
              const isExpanded = expandedUser === member.id;
              const isCurrentUser = member.id === user?.id;
              const canEdit = !isCurrentUser && role !== 'OWNER';

              return (
                <div
                  key={member.id}
                  className="bg-[var(--bg0)] border border-[var(--border)] rounded-lg overflow-hidden"
                >
                  {/* User Row */}
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : member.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg2)] transition-colors"
                    disabled={!canEdit}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#6c8cff] flex items-center justify-center text-white text-sm font-semibold">
                      {member.name?.charAt(0).toUpperCase() || member.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text)]">
                          {member.name || member.username}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6c8cff]/20 text-[#6c8cff]">You</span>
                        )}
                        {isCustom && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Custom</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{member.email || member.username}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded ${roleColors[role]}`}>
                      {role}
                    </span>
                    {canEdit && (
                      <ChevronDown
                        size={16}
                        className={`text-[var(--text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {/* Expanded Permissions */}
                  {isExpanded && canEdit && (
                    <div className="px-4 pb-4 pt-2 border-t border-[var(--border)]">
                      {/* Permission Toggles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {Object.entries(permissionLabels).map(([key, { label, description }]) => {
                          const enabled = getEffectivePermission(member.id, key);
                          return (
                            <button
                              key={key}
                              onClick={() => handleTogglePermission(member.id, key)}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                enabled
                                  ? 'bg-green-500/10 border-green-500/30'
                                  : 'bg-[var(--bg1)] border-[var(--border)] hover:border-[var(--border-hover)]'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center ${
                                enabled ? 'bg-green-500 text-white' : 'bg-[var(--bg2)] text-[var(--text-muted)]'
                              }`}>
                                {enabled && <Check size={12} />}
                              </div>
                              <div className="flex-1 text-left">
                                <span className="text-sm text-[var(--text)]">{label}</span>
                                <p className="text-[10px] text-[var(--text-muted)]">{description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Phase Visibility */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye size={14} className="text-[var(--text-muted)]" />
                          <span className="text-xs font-medium text-[var(--text)]">Visible Phases</span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            ({getVisiblePhases(member.id) === null ? 'All' : `${getVisiblePhases(member.id)?.length || 0} of ${phases?.length || 0}`})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {phases?.map(phase => {
                            const visiblePhases = getVisiblePhases(member.id);
                            const isVisible = visiblePhases === null || visiblePhases?.includes(phase.id);
                            return (
                              <button
                                key={phase.id}
                                onClick={() => handleTogglePhaseVisibility(member.id, phase.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                                  isVisible
                                    ? 'bg-[#6c8cff]/20 text-[#6c8cff] border border-[#6c8cff]/30'
                                    : 'bg-[var(--bg1)] text-[var(--text-muted)] border border-[var(--border)]'
                                }`}
                              >
                                {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                {phase.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                        <button
                          onClick={() => handleReset(member.id)}
                          disabled={saving || !isCustom}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50 transition-colors"
                        >
                          <RotateCcw size={12} />
                          Reset to Default
                        </button>
                        <button
                          onClick={() => handleSave(member.id)}
                          disabled={saving || !hasChanges(member.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-[#6c8cff] text-white rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
                        >
                          <Save size={12} />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg0)]">
          <p className="text-[10px] text-[var(--text-muted)] text-center">
            Only project owners and admins can modify permissions. Custom permissions override role defaults.
          </p>
        </div>
      </div>
    </div>
  );
}
