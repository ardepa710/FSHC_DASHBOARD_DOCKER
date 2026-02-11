import { useState, useRef } from 'react';
import { X, Download, Upload, FileJson, FileSpreadsheet, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useExportTasksJson, useExportTasksCsv, useImportTasks, usePhases } from '../hooks/useData';

export default function ExportImportModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('export');
  const [importData, setImportData] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const { data: phases = [] } = usePhases();
  const exportJson = useExportTasksJson();
  const exportCsv = useExportTasksCsv();
  const importTasks = useImportTasks();

  const handleExportJson = async () => {
    try {
      const response = await exportJson.mutateAsync({});
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Tasks exported to JSON');
    } catch (error) {
      toast.error('Failed to export tasks');
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await exportCsv.mutateAsync({});
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Tasks exported to CSV');
    } catch (error) {
      toast.error('Failed to export tasks');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.tasks && Array.isArray(data.tasks)) {
        setImportData(data);
      } else if (Array.isArray(data)) {
        setImportData({ tasks: data });
      } else {
        toast.error('Invalid file format');
      }
    } catch (error) {
      toast.error('Failed to parse file');
    }
  };

  const handleImport = async () => {
    if (!importData?.tasks?.length) {
      toast.error('No tasks to import');
      return;
    }

    const defaultPhaseId = phases[0]?.id;
    if (!defaultPhaseId) {
      toast.error('No phases available');
      return;
    }

    setImporting(true);
    try {
      const result = await importTasks.mutateAsync({
        tasks: importData.tasks,
        defaultPhaseId,
      });
      toast.success(`Imported ${result.data.imported} tasks`);
      if (result.data.errors > 0) {
        toast(`${result.data.errors} tasks had errors`, { icon: '⚠️' });
      }
      setImportData(null);
      onClose();
    } catch (error) {
      toast.error('Failed to import tasks');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[90vh] bg-[#111827] border border-[#1e2640] rounded-xl z-[101] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white">Export / Import Tasks</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-[#8892a4] hover:text-white transition-[color]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e2640]">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-[13px] font-medium transition-[color,border-color] ${
              activeTab === 'export'
                ? 'text-[#6c8cff] border-b-2 border-[#6c8cff]'
                : 'text-[#8892a4] hover:text-white'
            }`}
          >
            <Download size={16} className="inline mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-[13px] font-medium transition-[color,border-color] ${
              activeTab === 'import'
                ? 'text-[#6c8cff] border-b-2 border-[#6c8cff]'
                : 'text-[#8892a4] hover:text-white'
            }`}
          >
            <Upload size={16} className="inline mr-2" />
            Import
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-[13px] text-[#8892a4]">
                Export all tasks from the current project.
              </p>

              <button
                onClick={handleExportJson}
                disabled={exportJson.isPending}
                className="w-full p-4 bg-[#1a2035] border border-[#1e2640] rounded-lg hover:border-[#6c8cff] transition-[border-color] text-left flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-[#253050] flex items-center justify-center">
                  <FileJson size={24} className="text-[#6c8cff]" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white">Export as JSON</p>
                  <p className="text-[12px] text-[#8892a4]">
                    Full data including subtasks, tags, and metadata
                  </p>
                </div>
              </button>

              <button
                onClick={handleExportCsv}
                disabled={exportCsv.isPending}
                className="w-full p-4 bg-[#1a2035] border border-[#1e2640] rounded-lg hover:border-[#6c8cff] transition-[border-color] text-left flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-[#253050] flex items-center justify-center">
                  <FileSpreadsheet size={24} className="text-[#10b981]" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white">Export as CSV</p>
                  <p className="text-[12px] text-[#8892a4]">
                    Spreadsheet-compatible format for Excel/Sheets
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[13px] text-[#8892a4]">
                Import tasks from a JSON file. Tasks will be added to the current project.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".json"
                className="hidden"
              />

              {!importData ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-[#1e2640] rounded-lg hover:border-[#6c8cff] transition-[border-color] text-center"
                >
                  <Upload size={32} className="mx-auto mb-3 text-[#556]" />
                  <p className="text-[13px] text-[#8892a4]">
                    Click to select a JSON file
                  </p>
                  <p className="text-[11px] text-[#556] mt-1">
                    or drag and drop
                  </p>
                </button>
              ) : (
                <div className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileJson size={20} className="text-[#6c8cff]" />
                    <div>
                      <p className="text-[13px] font-medium text-white">
                        Ready to import
                      </p>
                      <p className="text-[11px] text-[#8892a4]">
                        {importData.tasks.length} tasks found
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#253050] rounded p-3 mb-3">
                    <p className="text-[11px] text-[#8892a4] mb-2">Preview:</p>
                    <ul className="text-[12px] text-[#e0e0e0] space-y-1">
                      {importData.tasks.slice(0, 5).map((t, i) => (
                        <li key={i} className="truncate">• {t.title}</li>
                      ))}
                      {importData.tasks.length > 5 && (
                        <li className="text-[#556]">
                          ...and {importData.tasks.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setImportData(null)}
                      className="flex-1 py-2 text-[12px] text-[#8892a4] hover:text-white border border-[#1e2640] rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="flex-1 py-2 text-[12px] bg-[#6c8cff] text-white rounded-lg hover:brightness-110 disabled:opacity-50"
                    >
                      {importing ? 'Importing...' : 'Import Tasks'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-[11px] text-[#f59e0b] bg-[rgba(245,158,11,0.1)] p-3 rounded-lg">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Tasks will be matched to phases and tags by name. Unmatched items will use defaults.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
