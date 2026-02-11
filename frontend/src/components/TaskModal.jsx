import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateTask, usePhases, useAssignees } from '../hooks/useData';

export default function TaskModal({ isOpen, onClose, defaultPhaseId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  const { data: phases = [], isLoading: phasesLoading, error: phasesError } = usePhases();
  const { data: assignees = [], isLoading: assigneesLoading, error: assigneesError } = useAssignees();
  const createTask = useCreateTask();

  // Set default phase when modal opens or phases load
  useEffect(() => {
    if (isOpen && phases.length > 0) {
      if (defaultPhaseId) {
        setPhaseId(String(defaultPhaseId));
      } else if (!phaseId) {
        setPhaseId(String(phases[0].id));
      }
    }
  }, [isOpen, phases, defaultPhaseId]);

  // Show error if phases fail to load
  useEffect(() => {
    if (phasesError) {
      toast.error('Failed to load phases: ' + (phasesError.message || 'Unknown error'));
    }
    if (assigneesError) {
      toast.error('Failed to load assignees: ' + (assigneesError.message || 'Unknown error'));
    }
  }, [phasesError, assigneesError]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPhaseId(defaultPhaseId ? String(defaultPhaseId) : (phases[0]?.id ? String(phases[0].id) : ''));
    setAssigneeId('');
    setPriority('MEDIUM');
    setDueDate('');
    setSubtasks([]);
    setNewSubtask('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Validations
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!phaseId) {
      toast.error('Please select a phase');
      return;
    }

    const phaseIdNum = parseInt(phaseId);
    if (isNaN(phaseIdNum)) {
      toast.error('Invalid phase selected');
      return;
    }

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        phaseId: phaseIdNum,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        priority,
        dueDate: dueDate || null,
        subtasks: subtasks.filter(s => s.trim()).map(s => ({ title: s })),
      };

      console.log('Creating task with data:', taskData);

      await createTask.mutateAsync(taskData);

      toast.success('Task created successfully!');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('Failed to create task: ' + errorMessage);
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) {
      toast.error('Subtask title cannot be empty');
      return;
    }
    setSubtasks([...subtasks, newSubtask.trim()]);
    setNewSubtask('');
    toast.success('Subtask added');
  };

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={handleClose} />
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-auto sm:w-[500px] md:w-[560px] sm:max-h-[90vh] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-[#1e2640] flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-white">Create New Task</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-md bg-[#1a2035] border border-[#1e2640] text-[#8892a4] hover:text-white hover:border-[#6c8cff] flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Loading State */}
        {(phasesLoading || assigneesLoading) && (
          <div className="p-4 text-center text-[#8892a4]">Loading...</div>
        )}

        {/* Form */}
        {!phasesLoading && !assigneesLoading && (
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 overflow-y-auto flex-1">
            {/* Title */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Title <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors placeholder:text-[#556]"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={3}
                className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors placeholder:text-[#556] resize-none"
              />
            </div>

            {/* Phase & Assignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                  Phase <span className="text-[#ef4444]">*</span>
                </label>
                <select
                  value={phaseId}
                  onChange={(e) => setPhaseId(e.target.value)}
                  className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors"
                >
                  <option value="">Select phase...</option>
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.icon} {phase.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors"
                />
              </div>
            </div>

            {/* Subtasks */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-1.5">
                Subtasks
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="flex-1 bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] transition-colors placeholder:text-[#556]"
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="px-3 py-2 bg-[#6c8cff] text-white rounded-lg text-[13px] font-semibold hover:brightness-110 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              {subtasks.length > 0 && (
                <div className="space-y-1">
                  {subtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3"
                    >
                      <span className="flex-1 text-[13px] text-[#e0e0e0]">{subtask}</span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(index)}
                        className="text-[#556] hover:text-[#ef4444] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#1e2640] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 sm:py-2 text-[13px] font-semibold text-[#8892a4] hover:text-white transition-colors text-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createTask.isPending || phasesLoading}
            className="px-4 py-2.5 sm:py-2 bg-[#6c8cff] text-white rounded-lg text-[13px] font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createTask.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </>
  );
}
