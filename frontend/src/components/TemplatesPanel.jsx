import { useState } from 'react';
import { X, Plus, FileText, Trash2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useCreateTaskFromTemplate,
  usePhases,
} from '../hooks/useData';

export default function TemplatesPanel({ isOpen, onClose }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', title: '', description: '', priority: 'MEDIUM' });
  const [createTaskPhaseId, setCreateTaskPhaseId] = useState('');

  const { data: templates = [], isLoading } = useTemplates();
  const { data: phases = [] } = usePhases();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const createTaskFromTemplate = useCreateTaskFromTemplate();

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.title.trim()) {
      toast.error('Name and title are required');
      return;
    }

    try {
      await createTemplate.mutateAsync(newTemplate);
      toast.success('Template created');
      setNewTemplate({ name: '', title: '', description: '', priority: 'MEDIUM' });
      setShowCreateForm(false);
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleCreateTask = async () => {
    if (!selectedTemplate || !createTaskPhaseId) {
      toast.error('Please select a phase');
      return;
    }

    try {
      await createTaskFromTemplate.mutateAsync({
        templateId: selectedTemplate.id,
        phaseId: parseInt(createTaskPhaseId),
      });
      toast.success('Task created from template');
      setSelectedTemplate(null);
      setCreateTaskPhaseId('');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-h-[85vh] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white flex items-center gap-2">
            <FileText size={18} className="text-[#6c8cff]" />
            Task Templates
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 py-1.5 text-[12px] bg-[#6c8cff] text-white rounded-lg hover:brightness-110 flex items-center gap-1"
            >
              <Plus size={14} />
              New Template
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-[#8892a4] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {showCreateForm && (
            <div className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-4 mb-4">
              <h3 className="text-[13px] font-semibold text-white mb-3">Create Template</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-[#556] uppercase mb-1">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Weekly Review"
                    className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#556] uppercase mb-1">Task Title</label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                    placeholder="Task title when created"
                    className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#556] uppercase mb-1">Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                    className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#556] uppercase mb-1">Priority</label>
                  <select
                    value={newTemplate.priority}
                    onChange={(e) => setNewTemplate({ ...newTemplate, priority: e.target.value })}
                    className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-2 text-[12px] text-[#8892a4] hover:text-white border border-[#1e2640] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    disabled={createTemplate.isPending}
                    className="flex-1 py-2 text-[12px] bg-[#6c8cff] text-white rounded-lg hover:brightness-110 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create task from template modal */}
          {selectedTemplate && (
            <div className="bg-[#1a2035] border border-[#6c8cff] rounded-lg p-4 mb-4">
              <h3 className="text-[13px] font-semibold text-white mb-3">
                Create Task from "{selectedTemplate.name}"
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-[#556] uppercase mb-1">Select Phase</label>
                  <select
                    value={createTaskPhaseId}
                    onChange={(e) => setCreateTaskPhaseId(e.target.value)}
                    className="w-full bg-[#253050] border border-[#1e2640] rounded-lg py-2 px-3 text-[13px] text-white focus:border-[#6c8cff] outline-none"
                  >
                    <option value="">Select phase...</option>
                    {phases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon} {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedTemplate(null); setCreateTaskPhaseId(''); }}
                    className="flex-1 py-2 text-[12px] text-[#8892a4] hover:text-white border border-[#1e2640] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    disabled={createTaskFromTemplate.isPending || !createTaskPhaseId}
                    className="flex-1 py-2 text-[12px] bg-[#10b981] text-white rounded-lg hover:brightness-110 disabled:opacity-50"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Templates List */}
          {isLoading ? (
            <div className="text-center py-8 text-[#8892a4]">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto mb-3 text-[#556] opacity-50" />
              <p className="text-[13px] text-[#8892a4]">No templates yet</p>
              <p className="text-[11px] text-[#556]">Create templates to quickly add common tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-3 hover:border-[#6c8cff] transition-[border-color] group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white">{template.name}</p>
                      <p className="text-[12px] text-[#8892a4] truncate">{template.title}</p>
                      {template.description && (
                        <p className="text-[11px] text-[#556] mt-1 line-clamp-1">{template.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="p-1.5 text-[#8892a4] hover:text-[#6c8cff]"
                        title="Create task from template"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1.5 text-[#8892a4] hover:text-[#ef4444]"
                        title="Delete template"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
