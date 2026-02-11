import { useEffect, useCallback } from 'react';
import { X, Keyboard } from 'lucide-react';
import useStore from '../store/useStore';
import { useUserSettings } from '../hooks/useData';

const shortcuts = [
  { keys: ['n'], description: 'New task', action: 'newTask' },
  { keys: ['f'], description: 'Focus search', action: 'focusSearch' },
  { keys: ['1'], description: 'List view', action: 'viewList' },
  { keys: ['2'], description: 'Board view', action: 'viewBoard' },
  { keys: ['3'], description: 'Timeline view', action: 'viewTimeline' },
  { keys: ['4'], description: 'Calendar view', action: 'viewCalendar' },
  { keys: ['5'], description: 'Gantt view', action: 'viewGantt' },
  { keys: ['r'], description: 'Reports', action: 'viewReports' },
  { keys: ['m'], description: 'My Tasks', action: 'viewMyTasks' },
  { keys: ['Escape'], description: 'Close panel/modal', action: 'close' },
  { keys: ['?'], description: 'Show shortcuts', action: 'showShortcuts' },
];

export function useKeyboardShortcuts() {
  const { data: settings } = useUserSettings();
  const {
    openTaskModal,
    closeDetail,
    setView,
    isKeyboardShortcutsOpen,
    openKeyboardShortcuts,
    closeKeyboardShortcuts,
  } = useStore();

  const handleKeyDown = useCallback((e) => {
    // Don't trigger if user is typing in an input
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) {
      return;
    }

    // Check if shortcuts are enabled
    if (settings?.keyboardShortcuts === false) return;

    const key = e.key.toLowerCase();

    switch (key) {
      case 'n':
        e.preventDefault();
        openTaskModal();
        break;
      case 'f':
        e.preventDefault();
        document.querySelector('[data-search-input]')?.focus();
        break;
      case '1':
        e.preventDefault();
        setView('list');
        break;
      case '2':
        e.preventDefault();
        setView('board');
        break;
      case '3':
        e.preventDefault();
        setView('timeline');
        break;
      case '4':
        e.preventDefault();
        setView('calendar');
        break;
      case '5':
        e.preventDefault();
        setView('gantt');
        break;
      case 'r':
        e.preventDefault();
        setView('reports');
        break;
      case 'm':
        e.preventDefault();
        setView('myTasks');
        break;
      case 'escape':
        closeDetail();
        closeKeyboardShortcuts();
        break;
      case '?':
        e.preventDefault();
        if (isKeyboardShortcutsOpen) {
          closeKeyboardShortcuts();
        } else {
          openKeyboardShortcuts();
        }
        break;
      default:
        break;
    }
  }, [settings?.keyboardShortcuts, openTaskModal, setView, closeDetail, isKeyboardShortcutsOpen, openKeyboardShortcuts, closeKeyboardShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default function KeyboardShortcutsModal() {
  const { isKeyboardShortcutsOpen, closeKeyboardShortcuts } = useStore();
  const { data: settings } = useUserSettings();

  if (!isKeyboardShortcutsOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={closeKeyboardShortcuts} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white flex items-center gap-2">
            <Keyboard size={18} className="text-[#6c8cff]" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={closeKeyboardShortcuts}
            aria-label="Close"
            className="text-[#8892a4] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {settings?.keyboardShortcuts === false && (
            <div className="mb-4 p-3 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-lg text-[12px] text-[#f59e0b]">
              Keyboard shortcuts are disabled. Enable them in Settings.
            </div>
          )}

          <div className="space-y-2">
            {shortcuts.map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-[#1e2640] last:border-b-0"
              >
                <span className="text-[13px] text-[#e0e0e0]">{shortcut.description}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="px-2 py-1 bg-[#253050] border border-[#1e2640] rounded text-[11px] text-[#8892a4] font-mono"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
