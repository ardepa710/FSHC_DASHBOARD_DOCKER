import { useState } from 'react';
import { Bookmark, Plus, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useFilterPresets,
  useCreateFilterPreset,
  useDeleteFilterPreset,
  useSetDefaultFilterPreset,
} from '../hooks/useData';
import useStore from '../store/useStore';

export default function FilterPresetsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');

  const {
    currentPhaseFilter,
    statusFilters,
    searchQuery,
    setPhaseFilter,
    setStatusFilters,
    setSearchQuery,
  } = useStore();

  const { data: presets = [] } = useFilterPresets();
  const createPreset = useCreateFilterPreset();
  const deletePreset = useDeleteFilterPreset();
  const setDefault = useSetDefaultFilterPreset();

  const currentFilters = {
    phase: currentPhaseFilter,
    statuses: statusFilters,
    search: searchQuery,
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      await createPreset.mutateAsync({
        name: presetName.trim(),
        filters: currentFilters,
      });
      toast.success('Filter preset saved');
      setPresetName('');
      setShowSaveForm(false);
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        toast.error('A preset with this name already exists');
      } else {
        toast.error('Failed to save preset');
      }
    }
  };

  const handleApplyPreset = (preset) => {
    const filters = preset.filters;
    if (filters.phase !== undefined) setPhaseFilter(filters.phase);
    if (filters.statuses) setStatusFilters(filters.statuses);
    if (filters.search !== undefined) setSearchQuery(filters.search);
    toast.success(`Applied "${preset.name}"`);
    setIsOpen(false);
  };

  const handleDeletePreset = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this preset?')) return;
    try {
      await deletePreset.mutateAsync(id);
      toast.success('Preset deleted');
    } catch (error) {
      toast.error('Failed to delete preset');
    }
  };

  const handleSetDefault = async (e, id) => {
    e.stopPropagation();
    try {
      await setDefault.mutateAsync(id);
      toast.success('Set as default');
    } catch (error) {
      toast.error('Failed to set default');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#8892a4] hover:text-white bg-[#1a2035] border border-[#1e2640] rounded-lg hover:border-[#6c8cff] transition-[border-color,color]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bookmark size={14} />
        Presets
        {presets.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-[#253050] rounded text-[10px]">
            {presets.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a2035] border border-[#1e2640] rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-[#1e2640] flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white">Filter Presets</span>
              <button
                onClick={() => setShowSaveForm(true)}
                className="text-[#6c8cff] hover:text-white"
                title="Save current filters"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Save Form */}
            {showSaveForm && (
              <div className="p-3 border-b border-[#1e2640] bg-[#253050]">
                <p className="text-[11px] text-[#8892a4] mb-2">Save current filters as preset</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="flex-1 bg-[#1a2035] border border-[#1e2640] rounded px-2 py-1.5 text-[12px] text-white focus:border-[#6c8cff] outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                  />
                  <button
                    onClick={handleSavePreset}
                    disabled={createPreset.isPending}
                    className="px-2 py-1.5 bg-[#6c8cff] text-white rounded text-[11px] hover:brightness-110 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowSaveForm(false); setPresetName(''); }}
                    className="px-2 py-1.5 text-[#8892a4] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Presets List */}
            <div className="max-h-64 overflow-y-auto">
              {presets.length === 0 ? (
                <div className="p-4 text-center text-[#556] text-[12px]">
                  No saved presets
                </div>
              ) : (
                presets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-2.5 hover:bg-[#253050] cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {preset.isDefault && (
                        <Star size={12} className="text-[#f59e0b] shrink-0" fill="#f59e0b" />
                      )}
                      <span className="text-[12px] text-[#e0e0e0] truncate">{preset.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!preset.isDefault && (
                        <button
                          onClick={(e) => handleSetDefault(e, preset.id)}
                          className="p-1 text-[#8892a4] hover:text-[#f59e0b]"
                          title="Set as default"
                        >
                          <Star size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeletePreset(e, preset.id)}
                        className="p-1 text-[#8892a4] hover:text-[#ef4444]"
                        title="Delete preset"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
