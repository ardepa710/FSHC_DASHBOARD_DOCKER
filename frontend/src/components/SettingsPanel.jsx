import { useState, useEffect } from 'react';
import { X, Settings, Sun, Moon, Monitor, Keyboard, Bell, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useUserSettings,
  useUpdateSettings,
  useUpdateTheme,
  useToggleKeyboardShortcuts,
  useUpdateEmailSettings,
} from '../hooks/useData';

export default function SettingsPanel({ isOpen, onClose }) {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const updateTheme = useUpdateTheme();
  const toggleKeyboardShortcuts = useToggleKeyboardShortcuts();
  const updateEmailSettings = useUpdateEmailSettings();

  const [localSettings, setLocalSettings] = useState({
    theme: 'dark',
    keyboardShortcuts: true,
    emailNotifications: false,
    emailTaskAssigned: true,
    emailTaskCompleted: true,
    emailMentions: true,
    emailDueReminders: true,
    reminderDaysBefore: 1,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        theme: settings.theme || 'dark',
        keyboardShortcuts: settings.keyboardShortcuts !== false,
        emailNotifications: settings.emailNotifications || false,
        emailTaskAssigned: settings.emailTaskAssigned !== false,
        emailTaskCompleted: settings.emailTaskCompleted !== false,
        emailMentions: settings.emailMentions !== false,
        emailDueReminders: settings.emailDueReminders !== false,
        reminderDaysBefore: settings.reminderDaysBefore || 1,
      });
    }
  }, [settings]);

  const handleThemeChange = async (theme) => {
    setLocalSettings(prev => ({ ...prev, theme }));
    try {
      await updateTheme.mutateAsync(theme);
      toast.success('Theme updated');
    } catch {
      toast.error('Failed to update theme');
    }
  };

  const handleKeyboardShortcutsToggle = async () => {
    const newValue = !localSettings.keyboardShortcuts;
    setLocalSettings(prev => ({ ...prev, keyboardShortcuts: newValue }));
    try {
      await toggleKeyboardShortcuts.mutateAsync(newValue);
      toast.success(newValue ? 'Keyboard shortcuts enabled' : 'Keyboard shortcuts disabled');
    } catch {
      toast.error('Failed to update setting');
    }
  };

  const handleEmailSettingsChange = async (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    try {
      await updateEmailSettings.mutateAsync({
        emailNotifications: newSettings.emailNotifications,
        emailTaskAssigned: newSettings.emailTaskAssigned,
        emailTaskCompleted: newSettings.emailTaskCompleted,
        emailMentions: newSettings.emailMentions,
        emailDueReminders: newSettings.emailDueReminders,
        reminderDaysBefore: newSettings.reminderDaysBefore,
      });
      toast.success('Email settings updated');
    } catch {
      toast.error('Failed to update email settings');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[85vh] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white flex items-center gap-2">
            <Settings size={18} className="text-[#6c8cff]" />
            Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#8892a4] hover:text-white transition-[color]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="text-center py-8 text-[#8892a4]">Loading settings...</div>
          ) : (
            <>
              {/* Theme Section */}
              <section>
                <h3 className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
                  <Sun size={14} className="text-[#f59e0b]" />
                  Appearance
                </h3>
                <div className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-4">
                  <p className="text-[12px] text-[#8892a4] mb-3">Choose your preferred theme</p>
                  <div className="flex gap-2">
                    {[
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => handleThemeChange(value)}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-[12px] flex items-center justify-center gap-2 transition-[background-color,border-color,color] ${
                          localSettings.theme === value
                            ? 'bg-[#6c8cff] text-white border border-[#6c8cff]'
                            : 'bg-[#253050] text-[#8892a4] border border-[#1e2640] hover:border-[#6c8cff] hover:text-white'
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Keyboard Shortcuts Section */}
              <section>
                <h3 className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
                  <Keyboard size={14} className="text-[#10b981]" />
                  Keyboard Shortcuts
                </h3>
                <div className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] text-white">Enable keyboard shortcuts</p>
                      <p className="text-[11px] text-[#556] mt-0.5">Press ? to view all shortcuts</p>
                    </div>
                    <button
                      onClick={handleKeyboardShortcutsToggle}
                      role="switch"
                      aria-checked={localSettings.keyboardShortcuts}
                      className={`w-11 h-6 rounded-full relative transition-[background-color] ${
                        localSettings.keyboardShortcuts ? 'bg-[#6c8cff]' : 'bg-[#253050]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-[left] ${
                          localSettings.keyboardShortcuts ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* Email Notifications Section */}
              <section>
                <h3 className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
                  <Mail size={14} className="text-[#ec4899]" />
                  Email Notifications
                </h3>
                <div className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-4 space-y-4">
                  {/* Master toggle */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e2640]">
                    <div>
                      <p className="text-[12px] text-white">Enable email notifications</p>
                      <p className="text-[11px] text-[#556] mt-0.5">Receive updates via email</p>
                    </div>
                    <button
                      onClick={() => handleEmailSettingsChange('emailNotifications', !localSettings.emailNotifications)}
                      role="switch"
                      aria-checked={localSettings.emailNotifications}
                      className={`w-11 h-6 rounded-full relative transition-[background-color] ${
                        localSettings.emailNotifications ? 'bg-[#6c8cff]' : 'bg-[#253050]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-[left] ${
                          localSettings.emailNotifications ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Individual toggles */}
                  <div className={`space-y-3 ${!localSettings.emailNotifications ? 'opacity-50 pointer-events-none' : ''}`}>
                    <NotificationToggle
                      label="Task assigned to me"
                      description="When someone assigns a task to you"
                      checked={localSettings.emailTaskAssigned}
                      onChange={(v) => handleEmailSettingsChange('emailTaskAssigned', v)}
                    />
                    <NotificationToggle
                      label="Task completed"
                      description="When a task you created is marked done"
                      checked={localSettings.emailTaskCompleted}
                      onChange={(v) => handleEmailSettingsChange('emailTaskCompleted', v)}
                    />
                    <NotificationToggle
                      label="Mentions"
                      description="When someone mentions you in a comment"
                      checked={localSettings.emailMentions}
                      onChange={(v) => handleEmailSettingsChange('emailMentions', v)}
                    />
                    <NotificationToggle
                      label="Due date reminders"
                      description="Reminder before tasks are due"
                      checked={localSettings.emailDueReminders}
                      onChange={(v) => handleEmailSettingsChange('emailDueReminders', v)}
                    />

                    {/* Reminder days selector */}
                    {localSettings.emailDueReminders && (
                      <div className="pt-2 pl-4">
                        <label className="text-[11px] text-[#556] block mb-1">
                          Remind me before due date
                        </label>
                        <select
                          value={localSettings.reminderDaysBefore}
                          onChange={(e) => handleEmailSettingsChange('reminderDaysBefore', parseInt(e.target.value))}
                          className="bg-[#253050] border border-[#1e2640] rounded-lg py-1.5 px-3 text-[12px] text-white focus:border-[#6c8cff] outline-none"
                        >
                          <option value={1}>1 day before</option>
                          <option value={2}>2 days before</option>
                          <option value={3}>3 days before</option>
                          <option value={7}>1 week before</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Notification Bell Settings */}
              <section>
                <h3 className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
                  <Bell size={14} className="text-[#f59e0b]" />
                  In-App Notifications
                </h3>
                <div className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-4">
                  <p className="text-[12px] text-[#8892a4]">
                    In-app notifications are always enabled. Click the bell icon in the header to view your notifications.
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[12px] text-[#e0e0e0]">{label}</p>
        <p className="text-[10px] text-[#556]">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className={`w-9 h-5 rounded-full relative transition-[background-color] ${
          checked ? 'bg-[#6c8cff]' : 'bg-[#253050]'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left] ${
            checked ? 'left-4' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}
