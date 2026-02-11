import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ListView from './components/ListView';
import BoardView from './components/BoardView';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import GanttView from './components/GanttView';
import MyTasksView from './components/MyTasksView';
import ReportsView from './components/ReportsView';
import DashboardView from './components/DashboardView';
import TaskDetail from './components/TaskDetail';
import TaskModal from './components/TaskModal';
import LoginPage from './components/LoginPage';
import ProjectSelector from './components/ProjectSelector';
import UserManagement from './components/UserManagement';
import NotificationsPanel from './components/NotificationsPanel';
import BulkActionsBar from './components/BulkActionsBar';
import KeyboardShortcutsModal, { useKeyboardShortcuts } from './components/KeyboardShortcuts';
import { ThemeProvider } from './components/ThemeProvider';
import ActivityLogPanel from './components/ActivityLogPanel';
import ExportImportModal from './components/ExportImportModal';
import TemplatesPanel from './components/TemplatesPanel';
import SettingsPanel from './components/SettingsPanel';
import RecurringTaskConfig from './components/RecurringTaskConfig';
import MobileNav from './components/MobileNav';
import GlobalSearch from './components/GlobalSearch';
import PermissionsPanel from './components/PermissionsPanel';
import { WebSocketProvider } from './hooks/useWebSocket';
import useStore from './store/useStore';

function Dashboard() {
  const {
    currentView,
    closeDetail,
    isCreateModalOpen,
    closeCreateModal,
    isTaskModalOpen,
    closeTaskModal,
    currentPhaseFilter,
    isActivityLogOpen,
    closeActivityLog,
    isExportImportOpen,
    closeExportImport,
    isTemplatesPanelOpen,
    closeTemplatesPanel,
    isSettingsPanelOpen,
    closeSettingsPanel,
    isRecurringPanelOpen,
    closeRecurringPanel,
    isGlobalSearchOpen,
    openGlobalSearch,
    closeGlobalSearch,
    isPermissionsPanelOpen,
    closePermissionsPanel,
  } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use keyboard shortcuts hook
  useKeyboardShortcuts();

  // Keyboard shortcuts for sidebar and global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openGlobalSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openGlobalSearch]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentView]);

  return (
    <div className="flex h-screen w-full bg-[var(--bg0)]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 pb-16 lg:pb-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-hidden">
          {currentView === 'list' && <ListView />}
          {currentView === 'board' && <BoardView />}
          {currentView === 'timeline' && <TimelineView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'gantt' && <GanttView />}
          {currentView === 'myTasks' && <MyTasksView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'dashboard' && <DashboardView />}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav onMenuClick={() => setSidebarOpen(true)} />

      <TaskDetail />
      <TaskModal
        isOpen={isCreateModalOpen || isTaskModalOpen}
        onClose={() => { closeCreateModal(); closeTaskModal(); }}
        defaultPhaseId={currentPhaseFilter !== 'all' ? currentPhaseFilter : undefined}
      />
      <NotificationsPanel />
      <BulkActionsBar />
      <KeyboardShortcutsModal />
      <ActivityLogPanel isOpen={isActivityLogOpen} onClose={closeActivityLog} />
      <ExportImportModal isOpen={isExportImportOpen} onClose={closeExportImport} />
      <TemplatesPanel isOpen={isTemplatesPanelOpen} onClose={closeTemplatesPanel} />
      <SettingsPanel isOpen={isSettingsPanelOpen} onClose={closeSettingsPanel} />
      <RecurringTaskConfig isOpen={isRecurringPanelOpen} onClose={closeRecurringPanel} />
      <GlobalSearch isOpen={isGlobalSearchOpen} onClose={closeGlobalSearch} />
      <PermissionsPanel isOpen={isPermissionsPanelOpen} onClose={closePermissionsPanel} />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, currentProject, user } = useStore();
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Admin managing users
  if (showUserManagement && user?.role === 'ADMIN') {
    return <UserManagement onBack={() => setShowUserManagement(false)} />;
  }

  // No project selected - show project selector
  if (!currentProject) {
    return <ProjectSelector onManageUsers={() => setShowUserManagement(true)} />;
  }

  // Show dashboard with WebSocket
  return (
    <WebSocketProvider>
      <Dashboard />
    </WebSocketProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
