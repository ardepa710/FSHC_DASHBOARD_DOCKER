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
