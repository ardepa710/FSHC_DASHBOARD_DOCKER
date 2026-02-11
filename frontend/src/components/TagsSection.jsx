import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTags, useCreateTag, useAddTagToTask, useRemoveTagFromTask } from '../hooks/useData';
import clsx from 'clsx';

const TAG_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#6c8cff', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

export default function TagsSection({ taskId, taskTags = [] }) {
  const { data: allTags = [] } = useTags();
  const createTag = useCreateTag();
  const addTag = useAddTagToTask();
  const removeTag = useRemoveTagFromTask();

  const [showDropdown, setShowDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  const currentTagIds = taskTags.map(tt => tt.tagId || tt.tag?.id);
  const availableTags = allTags.filter(t => !currentTagIds.includes(t.id));

  const handleAddTag = async (tagId) => {
    try {
      await addTag.mutateAsync({ taskId, tagId });
      setShowDropdown(false);
    } catch (error) {
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await removeTag.mutateAsync({ taskId, tagId });
    } catch (error) {
      toast.error('Failed to remove tag');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const result = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      });
      // Add the new tag to task
      await addTag.mutateAsync({ taskId, tagId: result.data.id });
      setNewTagName('');
      setShowDropdown(false);
      toast.success('Tag created and added');
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#556] flex items-center gap-1.5">
          <Tag size={12} />
          Tags
        </h4>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-[#6c8cff] hover:text-white transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Current Tags */}
      <div className="flex flex-wrap gap-1.5">
        {taskTags.length === 0 ? (
          <span className="text-[12px] text-[#556]">No tags</span>
        ) : (
          taskTags.map((tt) => {
            const tag = tt.tag || allTags.find(t => t.id === tt.tagId);
            if (!tag) return null;
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium group"
                style={{
                  background: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#ef4444]"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="mt-2 bg-[#1a2035] border border-[#1e2640] rounded-lg p-3 space-y-3">
          {/* Available Tags */}
          {availableTags.length > 0 && (
            <div>
              <p className="text-[10px] text-[#556] uppercase tracking-wider mb-1.5">Add existing tag</p>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium hover:brightness-110 transition-all"
                    style={{
                      background: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    + {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Tag */}
          <div>
            <p className="text-[10px] text-[#556] uppercase tracking-wider mb-1.5">Create new tag</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 bg-[#253050] border border-[#1e2640] rounded px-2 py-1 text-[11px] text-white outline-none focus:border-[#6c8cff]"
              />
              <div className="flex gap-1">
                {TAG_COLORS.slice(0, 5).map(color => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={clsx(
                      'w-5 h-5 rounded-full border-2 transition-all',
                      newTagColor === color ? 'border-white scale-110' : 'border-transparent'
                    )}
                    style={{ background: color }}
                  />
                ))}
              </div>
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTag.isPending}
                className="px-2 py-1 bg-[#6c8cff] text-white text-[11px] rounded hover:brightness-110 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
