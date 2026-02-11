import { useState, useEffect } from 'react';
import { Clock, Play, Square, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const formatEntryDate = (date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
};
import {
  useTimeEntries,
  useActiveTimer,
  useStartTimer,
  useStopTimer,
  useCreateTimeEntry,
} from '../hooks/useData';
import clsx from 'clsx';

function formatDuration(minutes) {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function TimeTrackerWidget({ taskId }) {
  const { data: entries = [], isLoading } = useTimeEntries(taskId);
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const createEntry = useCreateTimeEntry();

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const isTimerRunning = activeTimer?.taskId === taskId;

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!isTimerRunning || !activeTimer?.startTime) return;

    const calculateElapsed = () => {
      const start = new Date(activeTimer.startTime);
      const now = new Date();
      return Math.floor((now - start) / 1000);
    };

    setElapsedTime(calculateElapsed());

    const interval = setInterval(() => {
      setElapsedTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, activeTimer?.startTime]);

  const totalTime = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  const handleStartTimer = async () => {
    try {
      await startTimer.mutateAsync({ taskId });
      toast.success('Timer started');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer?.id) return;
    try {
      await stopTimer.mutateAsync(activeTimer.id);
      toast.success('Timer stopped');
    } catch (error) {
      toast.error('Failed to stop timer');
    }
  };

  const handleAddManualEntry = async () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes <= 0) {
      toast.error('Please enter a valid duration');
      return;
    }

    try {
      await createEntry.mutateAsync({
        taskId,
        data: {
          duration: totalMinutes,
          description: manualDescription,
        },
      });
      setManualHours('');
      setManualMinutes('');
      setManualDescription('');
      setShowManualEntry(false);
      toast.success('Time entry added');
    } catch (error) {
      toast.error('Failed to add time entry');
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-[#1e2640]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[12px] font-semibold text-[#8892a4] flex items-center gap-2">
          <Clock size={14} />
          Time Tracking
        </h4>
        <span className="text-[12px] text-white font-medium">
          Total: {formatDuration(totalTime)}
        </span>
      </div>

      {/* Timer Controls */}
      <div className="bg-[#1a2035] rounded-lg p-3 mb-3">
        {isTimerRunning ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[24px] font-mono text-[#6c8cff]">
                {formatTime(elapsedTime)}
              </p>
              <p className="text-[11px] text-[#8892a4]">Timer running</p>
            </div>
            <button
              onClick={handleStopTimer}
              disabled={stopTimer.isPending}
              className="w-12 h-12 rounded-full bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Square size={20} fill="white" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-[#8892a4]">No active timer</p>
              <p className="text-[11px] text-[#556]">Start tracking your work</p>
            </div>
            <button
              onClick={handleStartTimer}
              disabled={startTimer.isPending || (activeTimer && activeTimer.taskId !== taskId)}
              className={clsx(
                'w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50',
                activeTimer && activeTimer.taskId !== taskId
                  ? 'bg-[#556] cursor-not-allowed'
                  : 'bg-[#10b981] hover:bg-[#059669] text-white'
              )}
              title={activeTimer && activeTimer.taskId !== taskId ? 'Timer running on another task' : 'Start timer'}
            >
              <Play size={20} fill="white" />
            </button>
          </div>
        )}
      </div>

      {/* Manual Entry Toggle */}
      <button
        onClick={() => setShowManualEntry(!showManualEntry)}
        className="text-[11px] text-[#6c8cff] hover:text-white flex items-center gap-1 mb-3"
      >
        <Plus size={12} />
        Add manual entry
      </button>

      {/* Manual Entry Form */}
      {showManualEntry && (
        <div className="bg-[#1a2035] rounded-lg p-3 mb-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-[#556] block mb-1">Hours</label>
              <input
                type="number"
                min="0"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                className="w-full bg-[#253050] border border-[#1e2640] rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-[#6c8cff]"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[#556] block mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                className="w-full bg-[#253050] border border-[#1e2640] rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-[#6c8cff]"
                placeholder="0"
              />
            </div>
          </div>
          <input
            type="text"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-[#253050] border border-[#1e2640] rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-[#6c8cff]"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowManualEntry(false)}
              className="flex-1 px-3 py-1.5 text-[11px] border border-[#1e2640] rounded text-[#8892a4] hover:text-white hover:border-[#6c8cff]"
            >
              Cancel
            </button>
            <button
              onClick={handleAddManualEntry}
              disabled={createEntry.isPending}
              className="flex-1 px-3 py-1.5 text-[11px] bg-[#6c8cff] text-white rounded hover:brightness-110 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Recent Entries */}
      {isLoading ? (
        <div className="text-center text-[#8892a4] py-2">Loading...</div>
      ) : entries.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[10px] text-[#556] uppercase tracking-wider mb-1.5">Recent entries</p>
          {entries.slice(0, 5).map(entry => (
            <div
              key={entry.id}
              className="flex items-center justify-between bg-[#1a2035] rounded px-3 py-2 text-[12px]"
            >
              <div>
                <span className="text-white">{formatDuration(entry.duration)}</span>
                {entry.description && (
                  <span className="text-[#556] ml-2">- {entry.description}</span>
                )}
              </div>
              <span className="text-[#556] text-[10px]">
                {formatEntryDate(entry.startTime)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-[#556] text-center py-2">No time entries yet</p>
      )}
    </div>
  );
}
