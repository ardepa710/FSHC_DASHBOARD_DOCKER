import { useState } from 'react';
import { RefreshCw, X, Trash2, Play, Pause, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useRecurringTasks,
  useSetRecurringConfig,
  useDeleteRecurringConfig,
} from '../hooks/useData';
import useStore from '../store/useStore';

const frequencyLabels = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function RecurringTaskConfig({ isOpen, onClose }) {
  const [editingTask, setEditingTask] = useState(null);
  const { openDetail } = useStore();

  const { data: recurringTasks = [], isLoading } = useRecurringTasks();
  const setConfig = useSetRecurringConfig();
  const deleteConfig = useDeleteRecurringConfig();

  if (!isOpen) return null;

  const handleDelete = async (taskId) => {
    if (!confirm('Remove recurring configuration from this task?')) return;
    try {
      await deleteConfig.mutateAsync(taskId);
      toast.success('Recurring config removed');
    } catch {
      toast.error('Failed to remove config');
    }
  };

  const handleToggleActive = async (task) => {
    const config = task.recurringConfig;
    try {
      await setConfig.mutateAsync({
        taskId: task.id,
        data: { ...config, isActive: !config.isActive },
      });
      toast.success(config.isActive ? 'Recurring task paused' : 'Recurring task resumed');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleOpenTask = (taskId) => {
    onClose();
    openDetail(taskId);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-h-[85vh] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white flex items-center gap-2">
            <RefreshCw size={18} className="text-[#6c8cff]" />
            Recurring Tasks
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
        <div className="flex-1 overflow-y-auto p-4">
          {editingTask && (
            <RecurringEditForm
              task={editingTask}
              onSave={async (data) => {
                try {
                  await setConfig.mutateAsync({ taskId: editingTask.id, data });
                  toast.success('Recurring config updated');
                  setEditingTask(null);
                } catch {
                  toast.error('Failed to update');
                }
              }}
              onCancel={() => setEditingTask(null)}
              isPending={setConfig.isPending}
            />
          )}

          {/* Info */}
          <div className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-3 mb-4">
            <p className="text-[12px] text-[#8892a4]">
              To make a task recurring, open the task detail panel and click "Make Recurring" in the options menu.
            </p>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-8 text-[#8892a4]">Loading...</div>
          ) : recurringTasks.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw size={32} className="mx-auto mb-3 text-[#556] opacity-50" />
              <p className="text-[13px] text-[#8892a4]">No recurring tasks</p>
              <p className="text-[11px] text-[#556]">Open a task and enable recurring to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recurringTasks.map((task) => {
                const config = task.recurringConfig;
                return (
                  <div
                    key={task.id}
                    className={`bg-[#1a2035] border rounded-lg p-3 transition-[border-color,opacity] ${
                      config?.isActive ? 'border-[#1e2640]' : 'border-[#1e2640] opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleOpenTask(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleOpenTask(task.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${config?.isActive ? 'bg-[#10b981]' : 'bg-[#6b7280]'}`} />
                          <p className="text-[13px] font-medium text-white hover:text-[#6c8cff] transition-[color]">
                            {task.title}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-[#8892a4]">
                          <span>{frequencyLabels[config?.frequency] || config?.frequency}</span>
                          {config?.interval > 1 && <span>every {config.interval}</span>}
                          {task.phase && (
                            <span className="text-[#556]">{task.phase.icon} {task.phase.name}</span>
                          )}
                        </div>
                        {config?.lastCreated && (
                          <p className="mt-1 text-[10px] text-[#556]">
                            Last created: {dateFormatter.format(new Date(config.lastCreated))}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(task)}
                          className={`p-1.5 rounded transition-[color,background-color] ${
                            config?.isActive
                              ? 'text-[#f59e0b] hover:bg-[rgba(245,158,11,0.1)]'
                              : 'text-[#10b981] hover:bg-[rgba(16,185,129,0.1)]'
                          }`}
                          title={config?.isActive ? 'Pause' : 'Resume'}
                          aria-label={config?.isActive ? 'Pause recurring task' : 'Resume recurring task'}
                        >
                          {config?.isActive ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1.5 text-[#8892a4] hover:text-[#6c8cff] hover:bg-[rgba(108,140,255,0.1)] rounded transition-[color,background-color]"
                          title="Edit config"
                          aria-label="Edit recurring config"
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 text-[#8892a4] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] rounded transition-[color,background-color]"
                          title="Remove recurring"
                          aria-label="Remove recurring config"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RecurringEditForm({ task, onSave, onCancel, isPending }) {
  const config = task.recurringConfig || {};
  const [formData, setFormData] = useState({
    frequency: config.frequency || 'WEEKLY',
    interval: config.interval || 1,
    daysOfWeek: config.daysOfWeek ? JSON.parse(config.daysOfWeek) : [],
    dayOfMonth: config.dayOfMonth || 1,
    endDate: config.endDate ? config.endDate.split('T')[0] : '',
    isActive: config.isActive !== false,
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      frequency: formData.frequency,
      interval: formData.interval,
      daysOfWeek: formData.frequency === 'WEEKLY' ? formData.daysOfWeek : null,
      dayOfMonth: formData.frequency === 'MONTHLY' ? formData.dayOfMonth : null,
      endDate: formData.endDate || null,
      isActive: formData.isActive,
    });
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a2035] border border-[#6c8cff] rounded-lg p-4 mb-4">
      <h3 className="text-[13px] font-semibold text-white mb-3">
        Edit Recurring: {task.title}
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-frequency" className="block text-[10px] text-[#556] uppercase mb-1">Frequency</label>
            <select
              id="edit-frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-interval" className="block text-[10px] text-[#556] uppercase mb-1">Every</label>
            <input
              id="edit-interval"
              type="number"
              min="1"
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
              className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none"
            />
          </div>
        </div>

        {formData.frequency === 'WEEKLY' && (
          <div>
            <label className="block text-[10px] text-[#556] uppercase mb-2">Days of Week</label>
            <div className="flex gap-1">
              {dayNames.map((day, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`w-9 h-9 rounded text-[11px] font-medium transition-[background-color,color] ${
                    formData.daysOfWeek.includes(idx)
                      ? 'bg-[#6c8cff] text-white'
                      : 'bg-[#253050] text-[#8892a4] hover:text-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {formData.frequency === 'MONTHLY' && (
          <div>
            <label htmlFor="edit-day-of-month" className="block text-[10px] text-[#556] uppercase mb-1">Day of Month</label>
            <select
              id="edit-day-of-month"
              value={formData.dayOfMonth}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
              className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="edit-end-date" className="block text-[10px] text-[#556] uppercase mb-1">End Date (Optional)</label>
          <input
            id="edit-end-date"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-[12px] text-[#8892a4] hover:text-white border border-[#1e2640] rounded-lg transition-[color]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2 text-[12px] bg-[#6c8cff] text-white rounded-lg hover:brightness-110 disabled:opacity-50 transition-[filter]"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
