import { useState } from 'react';
import { Plus, Trash2, Edit3, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCustomFields,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
  useTaskCustomFieldValues,
  useSetCustomFieldValue,
} from '../hooks/useData';

const fieldTypes = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'SELECT', label: 'Select' },
  { value: 'CHECKBOX', label: 'Checkbox' },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function CustomFieldsSection({ taskId }) {
  const [showAddField, setShowAddField] = useState(false);

  const { data: customFields = [] } = useCustomFields();
  const { data: fieldValues = [] } = useTaskCustomFieldValues(taskId);
  const setFieldValue = useSetCustomFieldValue();

  // Get value for a specific field
  const getFieldValue = (fieldId) => {
    const fv = fieldValues.find(v => v.customFieldId === fieldId);
    return fv?.value || '';
  };

  const handleValueChange = async (fieldId, value) => {
    try {
      await setFieldValue.mutateAsync({ taskId, customFieldId: fieldId, value });
    } catch {
      toast.error('Failed to update field');
    }
  };

  if (customFields.length === 0 && !showAddField) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setShowAddField(true)}
          className="text-[12px] text-[#6c8cff] hover:text-white flex items-center gap-1 transition-[color]"
        >
          <Plus size={14} />
          Add custom fields
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-[#556] uppercase">Custom Fields</h4>
        <button
          onClick={() => setShowAddField(!showAddField)}
          className="text-[#6c8cff] hover:text-white transition-[color]"
          aria-label="Add custom field"
        >
          <Plus size={14} />
        </button>
      </div>

      {showAddField && (
        <AddFieldForm onClose={() => setShowAddField(false)} />
      )}

      {customFields.map((field) => (
        <CustomFieldInput
          key={field.id}
          field={field}
          value={getFieldValue(field.id)}
          onChange={(v) => handleValueChange(field.id, v)}
        />
      ))}
    </div>
  );
}

function AddFieldForm({ onClose }) {
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [options, setOptions] = useState('');

  const createField = useCreateCustomField();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Field name is required');
      return;
    }

    try {
      await createField.mutateAsync({
        name: name.trim(),
        fieldType,
        options: fieldType === 'SELECT' ? options.split(',').map(o => o.trim()).filter(Boolean) : null,
      });
      toast.success('Custom field created');
      onClose();
    } catch {
      toast.error('Failed to create field');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-3 space-y-2">
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Field name..."
          className="w-full bg-[#253050] border border-[#1e2640] rounded py-1.5 px-2 text-[12px] text-white focus:border-[#6c8cff] outline-none"
          autoFocus
          autoComplete="off"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
          className="flex-1 bg-[#253050] border border-[#1e2640] rounded py-1.5 px-2 text-[12px] text-white focus:border-[#6c8cff] outline-none"
        >
          {fieldTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      {fieldType === 'SELECT' && (
        <input
          type="text"
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          placeholder="Options (comma separated)..."
          className="w-full bg-[#253050] border border-[#1e2640] rounded py-1.5 px-2 text-[12px] text-white focus:border-[#6c8cff] outline-none"
          autoComplete="off"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-1.5 text-[11px] text-[#8892a4] hover:text-white border border-[#1e2640] rounded transition-[color]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createField.isPending}
          className="flex-1 py-1.5 text-[11px] bg-[#6c8cff] text-white rounded hover:brightness-110 disabled:opacity-50 transition-[filter]"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function CustomFieldInput({ field, value, onChange }) {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const deleteField = useDeleteCustomField();

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete custom field "${field.name}"?`)) return;
    try {
      await deleteField.mutateAsync(field.id);
      toast.success('Field deleted');
    } catch {
      toast.error('Failed to delete field');
    }
  };

  const renderInput = () => {
    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter text..."
            className="w-full bg-[#253050] border border-[#1e2640] rounded py-1.5 px-2 text-[12px] text-white focus:border-[#6c8cff] outline-none"
            autoComplete="off"
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="0"
            className="w-full bg-[#253050] border border-[#1e2640] rounded py-1.5 px-2 text-[12px] text-white focus:border-[#6c8cff] outline-none"
            autoComplete="off"
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full bg-[#253050] border border-[#1e2640] rounded py-1.5 px-2 text-[12px] text-white focus:border-[#6c8cff] outline-none"
          />
        );

      case 'SELECT':
        const options = field.options ? JSON.parse(field.options) : [];
        return (
          <select
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full bg-[#253050] border border-[#1e2640] rounded py-1.5 px-2 text-[12px] text-white focus:border-[#6c8cff] outline-none"
          >
            <option value="">Select...</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'CHECKBOX':
        return (
          <button
            onClick={() => {
              const newValue = localValue === 'true' ? 'false' : 'true';
              setLocalValue(newValue);
              onChange(newValue);
            }}
            role="checkbox"
            aria-checked={localValue === 'true'}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-[background-color,border-color] ${
              localValue === 'true'
                ? 'bg-[#6c8cff] border-[#6c8cff]'
                : 'bg-[#253050] border-[#1e2640]'
            }`}
          >
            {localValue === 'true' && <Check size={12} className="text-white" />}
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <div className="flex-1">
        <label className="block text-[10px] text-[#556] mb-1">{field.name}</label>
        {renderInput()}
      </div>
      <button
        onClick={handleDelete}
        className="p-1 text-[#556] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-[color,opacity] mt-4"
        aria-label={`Delete ${field.name} field`}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// Manager component for managing all custom fields (for settings)
export function CustomFieldsManager({ isOpen, onClose }) {
  const { data: customFields = [], isLoading } = useCustomFields();
  const deleteField = useDeleteCustomField();

  if (!isOpen) return null;

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete custom field "${name}"? This will remove values from all tasks.`)) return;
    try {
      await deleteField.mutateAsync(id);
      toast.success('Field deleted');
    } catch {
      toast.error('Failed to delete field');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-h-[70vh] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-white">Manage Custom Fields</h2>
          <button onClick={onClose} aria-label="Close" className="text-[#8892a4] hover:text-white transition-[color]">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4 text-[#8892a4]">Loading...</div>
          ) : customFields.length === 0 ? (
            <div className="text-center py-4 text-[#8892a4] text-[12px]">
              No custom fields defined yet
            </div>
          ) : (
            <div className="space-y-2">
              {customFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between py-2 px-3 bg-[#1a2035] rounded-lg">
                  <div>
                    <p className="text-[12px] text-white">{field.name}</p>
                    <p className="text-[10px] text-[#556]">{fieldTypes.find(t => t.value === field.fieldType)?.label}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(field.id, field.name)}
                    className="p-1.5 text-[#8892a4] hover:text-[#ef4444] transition-[color]"
                    aria-label={`Delete ${field.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
