import { X, Check, Plus, Trash2, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import {
  useTask,
  useUpdateTaskStatus,
  useToggleSubtask,
  useCreateSubtask,
  useDeleteSubtask,
  useCreateNote,
  useDeleteNote,
  useDeleteTask,
  useUpdateTask,
  usePhases,
  useAssignees,
} from '../hooks/useData';
import { format, formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const phaseIcons = ['📋', '🏢', '🏥', '🔍', '🔧', '🚀', '📈'];
const phaseNames = [
  'Prototype & Prep',
  'Corporate Discovery',
  'Site Discovery',
  'Synthesis & Sign-off',
  'Build in Retool',
  'Deploy & Train',
  'Expand Payers',
];

const statusLabels = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const statusClasses = {
  NOT_STARTED: 'bg-[rgba(85,85,102,0.2)] text-[#556]',
  IN_PROGRESS: 'bg-[rgba(108,140,255,0.15)] text-[#6c8cff]',
  BLOCKED: 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]',
  DONE: 'bg-[rgba(16,185,129,0.15)] text-[#10b981]',
};

const dotColors = {
  NOT_STARTED: 'bg-[#556]',
  IN_PROGRESS: 'bg-[#6c8cff]',
  BLOCKED: 'bg-[#ef4444]',
  DONE: 'bg-[#10b981]',
};

const priorityColors = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#556',
};

export default function TaskDetail() {
  const { selectedTaskId, isDetailOpen, closeDetail } = useStore();
  const { data: task, isLoading, error: taskError } = useTask(selectedTaskId);
  const { data: phases = [] } = usePhases();
  const { data: assignees = [] } = useAssignees();

  const updateStatus = useUpdateTaskStatus();
  const updateTask = useUpdateTask();
  const toggleSubtask = useToggleSubtask();
  const createSubtask = useCreateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const deleteTask = useDeleteTask();

  const [newSubtask, setNewSubtask] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Show error if task fails to load
  useEffect(() => {
    if (taskError) {
      toast.error('Failed to load task: ' + (taskError.message || 'Unknown error'));
    }
  }, [taskError]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetail]);

  // Reset edit form when task changes
  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        phaseId: task.phaseId,
        assigneeId: task.assigneeId || '',
        priority: task.priority,
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      });
    }
  }, [task]);

  if (!isDetailOpen) return null;

  const cycleStatus = async () => {
    if (!task) return;
    const order = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
    const idx = order.indexOf(task.status);
    const newStatus = order[(idx + 1) % order.length];
    try {
      await updateStatus.mutateAsync({ id: task.id, status: newStatus });
      toast.success(`Status changed to ${statusLabels[newStatus]}`);
    } catch (error) {
      toast.error('Failed to change status: ' + (error.response?.data?.error || error.message));
    }
  };

  const markDone = async () => {
    if (!task) return;
    if (task.status === 'DONE') {
      toast('Task is already done', { icon: 'ℹ️' });
      return;
    }
    try {
      await updateStatus.mutateAsync({ id: task.id, status: 'DONE' });
      toast.success('Task marked as done!');
    } catch (error) {
      toast.error('Failed to mark as done: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    if (!task) return;
    try {
      await toggleSubtask.mutateAsync({ taskId: task.id, subtaskId });
    } catch (error) {
      toast.error('Failed to toggle subtask: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddSubtask = async () => {
    if (!task) return;
    if (!newSubtask.trim()) {
      toast.error('Subtask title cannot be empty');
      return;
    }
    try {
      await createSubtask.mutateAsync({ taskId: task.id, title: newSubtask.trim() });
      setNewSubtask('');
      toast.success('Subtask added');
    } catch (error) {
      toast.error('Failed to add subtask: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!task) return;
    try {
      await deleteSubtask.mutateAsync({ taskId: task.id, subtaskId });
      toast.success('Subtask deleted');
    } catch (error) {
      toast.error('Failed to delete subtask: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddNote = async () => {
    if (!task) return;
    if (!newNote.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }
    try {
      await createNote.mutateAsync({ taskId: task.id, content: newNote.trim() });
      setNewNote('');
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!task) return;
    try {
      await deleteNote.mutateAsync({ taskId: task.id, noteId });
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted');
      closeDetail();
    } catch (error) {
      toast.error('Failed to delete task: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSaveEdit = async () => {
    if (!task) return;

    // Validations
    if (!editForm.title?.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!editForm.phaseId) {
      toast.error('Phase is required');
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: editForm.title.trim(),
          description: editForm.description?.trim() || null,
          phaseId: parseInt(editForm.phaseId),
          assigneeId: editForm.assigneeId ? parseInt(editForm.assigneeId) : null,
          priority: editForm.priority,
          dueDate: editForm.dueDate || null,
        },
      });
      setIsEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getDueClass = (date) => {
    if (!date) return '';
    const now = new Date();
    const due = new Date(date);
    const diff = (due - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'text-[#ef4444] font-semibold';
    if (diff < 7) return 'text-[#f59e0b]';
    return '';
  };

  const phaseIdx = task?.phase
    ? phaseNames.findIndex((name) => name === task.phase.name)
    : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/50 z-[100] transition-opacity duration-200',
          isDetailOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeDetail}
      />

      {/* Panel */}
      <div
        className={clsx(
          'fixed top-0 right-0 w-full sm:w-[400px] md:w-[480px] lg:w-[520px] h-screen bg-[#111827] border-l border-[#1e2640] z-[101] transition-all duration-300 flex flex-col overflow-y-auto',
          isDetailOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[#8892a4]">
            Loading...
          </div>
        ) : task ? (
          <>
            {/* Top Bar */}
            <div className="p-4 sm:p-5 border-b border-[#1e2640] shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeDetail}
                  className="w-[30px] h-[30px] rounded-md bg-[#1a2035] border border-[#1e2640] text-[#8892a4] hover:text-white hover:border-[#6c8cff] flex items-center justify-center transition-all shrink-0"
                >
                  <X size={16} />
                </button>

                <span
                  className="text-[10px] px-2.5 py-1 rounded-full font-semibold truncate max-w-[120px] sm:max-w-none"
                  style={{
                    background: `${task.phase?.color || '#6c8cff'}20`,
                    color: task.phase?.color || '#6c8cff',
                  }}
                >
                  {task.phase?.name || 'Unknown'}
                </span>

                {/* Desktop action buttons */}
                <div className="ml-auto hidden sm:flex gap-1.5">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-md border border-[#1e2640] bg-[#1a2035] text-[#8892a4] hover:border-[#6c8cff] hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateTask.isPending}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-md bg-[#10b981] border border-[#10b981] text-white hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {updateTask.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-md border border-[#1e2640] bg-[#1a2035] text-[#8892a4] hover:border-[#6c8cff] hover:text-white transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={cycleStatus}
                        disabled={updateStatus.isPending}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-md border border-[#1e2640] bg-[#1a2035] text-[#8892a4] hover:border-[#6c8cff] hover:text-white transition-all disabled:opacity-50"
                      >
                        Change Status
                      </button>
                      <button
                        onClick={markDone}
                        disabled={updateStatus.isPending}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-md bg-[#6c8cff] border border-[#6c8cff] text-white hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        Mark Done
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile action buttons */}
              <div className="flex sm:hidden gap-2 mt-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-3 py-2 text-[12px] font-semibold rounded-md border border-[#1e2640] bg-[#1a2035] text-[#8892a4] hover:border-[#6c8cff] hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={updateTask.isPending}
                      className="flex-1 px-3 py-2 text-[12px] font-semibold rounded-md bg-[#10b981] border border-[#10b981] text-white hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {updateTask.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 px-3 py-2 text-[12px] font-semibold rounded-md border border-[#1e2640] bg-[#1a2035] text-[#8892a4] hover:border-[#6c8cff] hover:text-white transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={cycleStatus}
                      disabled={updateStatus.isPending}
                      className="flex-1 px-3 py-2 text-[12px] font-semibold rounded-md border border-[#1e2640] bg-[#1a2035] text-[#8892a4] hover:border-[#6c8cff] hover:text-white transition-all disabled:opacity-50"
                    >
                      Status
                    </button>
                    <button
                      onClick={markDone}
                      disabled={updateStatus.isPending}
                      className="flex-1 px-3 py-2 text-[12px] font-semibold rounded-md bg-[#6c8cff] border border-[#6c8cff] text-white hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1">
                      Title <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1">
                        Phase <span className="text-[#ef4444]">*</span>
                      </label>
                      <select
                        value={editForm.phaseId}
                        onChange={(e) => setEditForm({ ...editForm, phaseId: e.target.value })}
                        className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff]"
                      >
                        {phases.map((p) => (
                          <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1">Assignee</label>
                      <select
                        value={editForm.assigneeId}
                        onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
                        className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff]"
                      >
                        <option value="">Unassigned</option>
                        {assignees.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1">Priority</label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff]"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1">Due Date</label>
                      <input
                        type="date"
                        value={editForm.dueDate}
                        onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                        className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteTask}
                    disabled={deleteTask.isPending}
                    className="w-full mt-4 px-3 py-2 text-[12px] font-semibold rounded-md border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-all disabled:opacity-50"
                  >
                    {deleteTask.isPending ? 'Deleting...' : 'Delete Task'}
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-white leading-snug mb-5">
                    {task.title}
                  </h2>

                  {/* Status & Priority */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">Status</p>
                      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', statusClasses[task.status])}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[task.status])} />
                        {statusLabels[task.status]}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">Priority</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-[3px] h-2.5 rounded-sm"
                              style={{
                                background:
                                  (task.priority === 'HIGH' && i < 3) ||
                                  (task.priority === 'MEDIUM' && i < 2) ||
                                  (task.priority === 'LOW' && i < 1)
                                    ? priorityColors[task.priority]
                                    : '#253050',
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] text-[#8892a4] capitalize">
                          {task.priority?.toLowerCase() || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignee & Due Date */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">Assignee</p>
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ background: task.assignee.color }}
                            >
                              {task.assignee.initials}
                            </div>
                            <span className="text-[13px] text-[#e0e0e0]">{task.assignee.name}</span>
                          </>
                        ) : (
                          <span className="text-[13px] text-[#556]">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">Due Date</p>
                      <span className={clsx('text-[13px] text-[#8892a4]', getDueClass(task.dueDate))}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">Description</p>
                      <p className="text-[13px] text-[#e0e0e0] leading-relaxed">{task.description}</p>
                    </div>
                  )}

                  {/* Subtasks */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[12px] font-semibold text-[#8892a4]">
                        Subtasks ({task.subtasks?.length || 0})
                      </h4>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                        placeholder="Add a subtask..."
                        className="flex-1 bg-[#1a2035] border border-[#1e2640] rounded-lg py-1.5 px-3 text-[12px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] placeholder:text-[#556]"
                      />
                      <button
                        onClick={handleAddSubtask}
                        disabled={createSubtask.isPending}
                        className="px-2 py-1.5 bg-[#6c8cff] text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {task.subtasks?.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2.5 py-2 border-b border-[rgba(30,38,64,0.5)] last:border-b-0 group"
                      >
                        <button
                          onClick={() => handleToggleSubtask(subtask.id)}
                          className={clsx(
                            'w-4 h-4 rounded flex items-center justify-center text-[10px] border-2 transition-all',
                            subtask.completed
                              ? 'border-[#10b981] bg-[#10b981] text-white'
                              : 'border-[#556] hover:border-[#6c8cff]'
                          )}
                        >
                          {subtask.completed && <Check size={10} />}
                        </button>
                        <span
                          className={clsx(
                            'flex-1 text-[13px]',
                            subtask.completed ? 'text-[#556] line-through' : 'text-[#e0e0e0]'
                          )}
                        >
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#556] hover:text-[#ef4444] transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Deliverables */}
                  {task.deliverables && task.deliverables.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#556] mb-2">
                        Deliverables
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {task.deliverables.map((d) => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1.5 bg-[#1a2035] border border-[#1e2640] rounded-md px-3 py-1.5 text-[12px] text-[#8892a4]"
                          >
                            {d.label}
                            <span className="text-[9px] uppercase tracking-wide text-[#556] bg-[#253050] px-1.5 py-0.5 rounded">
                              {d.type}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mt-5 pt-5 border-t border-[#1e2640]">
                    <h4 className="text-[12px] font-semibold text-[#8892a4] mb-3">
                      Notes ({task.notes?.length || 0})
                    </h4>

                    <div className="flex gap-2 mb-4">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        rows={2}
                        className="flex-1 bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[12px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] placeholder:text-[#556] resize-none"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || createNote.isPending}
                        className="px-3 self-end py-2 bg-[#6c8cff] text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        <Send size={14} />
                      </button>
                    </div>

                    {task.notes?.map((note) => (
                      <div
                        key={note.id}
                        className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-3 mb-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] text-[#e0e0e0] leading-relaxed flex-1">
                            {note.content}
                          </p>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#556] hover:text-[#ef4444] transition-all shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-[#556]">
                          {note.author && (
                            <>
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ background: note.author.color }}
                              >
                                {note.author.initials}
                              </div>
                              <span>{note.author.name}</span>
                              <span>-</span>
                            </>
                          )}
                          <span>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[#8892a4]">
            Task not found
          </div>
        )}
      </div>
    </>
  );
}
