import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        currentProject: null
      }),

      // Current project
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),

      // View state
      currentView: 'list',
      setCurrentView: (view) => set({ currentView: view }),

      // Phase filter
      currentPhaseFilter: 'all',
      setPhaseFilter: (phase) => set({ currentPhaseFilter: phase }),

      // Status filters
      statusFilters: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE'],
      toggleStatusFilter: (status) =>
        set((state) => {
          const newFilters = state.statusFilters.includes(status)
            ? state.statusFilters.filter(s => s !== status)
            : [...state.statusFilters, status];
          return { statusFilters: newFilters };
        }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Selected task for detail panel
      selectedTaskId: null,
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),

      // Detail panel open state
      isDetailOpen: false,
      openDetail: (id) => set({ selectedTaskId: id, isDetailOpen: true }),
      closeDetail: () => set({ isDetailOpen: false, selectedTaskId: null }),

      // Create task modal
      isCreateModalOpen: false,
      openCreateModal: () => set({ isCreateModalOpen: true }),
      closeCreateModal: () => set({ isCreateModalOpen: false }),

      // Collapsed phases
      collapsedPhases: [],
      togglePhaseCollapse: (phaseId) =>
        set((state) => {
          const newCollapsed = state.collapsedPhases.includes(phaseId)
            ? state.collapsedPhases.filter(id => id !== phaseId)
            : [...state.collapsedPhases, phaseId];
          return { collapsedPhases: newCollapsed };
        }),

      // Selected tasks for bulk operations
      selectedTasks: [],
      toggleTaskSelection: (taskId) =>
        set((state) => {
          const newSelected = state.selectedTasks.includes(taskId)
            ? state.selectedTasks.filter(id => id !== taskId)
            : [...state.selectedTasks, taskId];
          return { selectedTasks: newSelected };
        }),
      clearSelectedTasks: () => set({ selectedTasks: [] }),
      setSelectedTasks: (taskIds) => set({ selectedTasks: taskIds }),

      // Notifications panel
      isNotificationsPanelOpen: false,
      openNotificationsPanel: () => set({ isNotificationsPanelOpen: true }),
      closeNotificationsPanel: () => set({ isNotificationsPanelOpen: false }),

      // Tag filter
      tagFilters: [],
      toggleTagFilter: (tagId) =>
        set((state) => {
          const newFilters = state.tagFilters.includes(tagId)
            ? state.tagFilters.filter(id => id !== tagId)
            : [...state.tagFilters, tagId];
          return { tagFilters: newFilters };
        }),
      clearTagFilters: () => set({ tagFilters: [] }),

      // View management (alias for keyboard shortcuts)
      setView: (view) => set({ currentView: view }),

      // Task modal for creating tasks (used by keyboard shortcut 'n')
      isTaskModalOpen: false,
      openTaskModal: () => set({ isTaskModalOpen: true }),
      closeTaskModal: () => set({ isTaskModalOpen: false }),

      // Keyboard shortcuts modal
      isKeyboardShortcutsOpen: false,
      openKeyboardShortcuts: () => set({ isKeyboardShortcutsOpen: true }),
      closeKeyboardShortcuts: () => set({ isKeyboardShortcutsOpen: false }),

      // Activity log panel
      isActivityLogOpen: false,
      openActivityLog: () => set({ isActivityLogOpen: true }),
      closeActivityLog: () => set({ isActivityLogOpen: false }),

      // Export/Import modal
      isExportImportOpen: false,
      openExportImport: () => set({ isExportImportOpen: true }),
      closeExportImport: () => set({ isExportImportOpen: false }),

      // Templates panel
      isTemplatesPanelOpen: false,
      openTemplatesPanel: () => set({ isTemplatesPanelOpen: true }),
      closeTemplatesPanel: () => set({ isTemplatesPanelOpen: false }),

      // Settings panel
      isSettingsPanelOpen: false,
      openSettingsPanel: () => set({ isSettingsPanelOpen: true }),
      closeSettingsPanel: () => set({ isSettingsPanelOpen: false }),

      // Recurring tasks panel
      isRecurringPanelOpen: false,
      openRecurringPanel: () => set({ isRecurringPanelOpen: true }),
      closeRecurringPanel: () => set({ isRecurringPanelOpen: false }),

      // Set filters (used by filter presets)
      setStatusFilters: (filters) => set({ statusFilters: filters }),
    }),
    {
      name: 'fshc-dashboard-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentProject: state.currentProject,
        currentView: state.currentView,
      }),
    }
  )
);

export default useStore;
