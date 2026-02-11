import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ListView from './components/ListView';
import BoardView from './components/BoardView';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import MyTasksView from './components/MyTasksView';
import ReportsView from './components/ReportsView';
import TaskDetail from './components/TaskDetail';
import TaskModal from './components/TaskModal';
import LoginPage from './components/LoginPage';
import ProjectSelector from './components/ProjectSelector';
import UserManagement from './components/UserManagement';
import NotificationsPanel from './components/NotificationsPanel';
import BulkActionsBar from './components/BulkActionsBar';
import useStore from './store/useStore';

function Dashboard() {
  const { currentView, closeDetail, isCreateModalOpen, closeCreateModal, currentPhaseFilter } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDetail();
        closeCreateModal();
        setSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetail, closeCreateModal]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentView]);

  return (
    <div className="flex h-screen w-full bg-[#0a0f1c]">
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
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-hidden">
          {currentView === 'list' && <ListView />}
          {currentView === 'board' && <BoardView />}
          {currentView === 'timeline' && <TimelineView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'mytasks' && <MyTasksView />}
          {currentView === 'reports' && <ReportsView />}
        </div>
      </main>

      <TaskDetail />
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        defaultPhaseId={currentPhaseFilter !== 'all' ? currentPhaseFilter : undefined}
      />
      <NotificationsPanel />
      <BulkActionsBar />
    </div>
  );
}

function App() {
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

  // Show dashboard
  return <Dashboard />;
}

export default App;
