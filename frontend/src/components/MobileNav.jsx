import { LayoutDashboard, LayoutList, Columns3, Calendar, User, Menu } from 'lucide-react';
import useStore from '../store/useStore';

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'list', label: 'List', icon: LayoutList },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'myTasks', label: 'Tasks', icon: User },
];

export default function MobileNav({ onMenuClick }) {
  const { currentView, setCurrentView } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg1)] border-t border-[var(--border)] z-50 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-[color] ${
                isActive ? 'text-[var(--blue)]' : 'text-[var(--text2)]'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full text-[var(--text2)]"
          aria-label="Menu"
        >
          <Menu size={20} />
          <span className="text-[10px] mt-1">More</span>
        </button>
      </div>
    </nav>
  );
}
