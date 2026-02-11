import { useState, useRef } from 'react';
import { Paperclip, Upload, Download, Trash2, File, Image, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../hooks/useData';
import useStore from '../store/useStore';

const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
};

const FILE_ICONS = {
  'image/': Image,
  'application/pdf': FileText,
  'text/': FileText,
  'default': File,
};

function getFileIcon(mimeType) {
  for (const [key, Icon] of Object.entries(FILE_ICONS)) {
    if (key !== 'default' && mimeType.startsWith(key)) {
      return Icon;
    }
  }
  return FILE_ICONS.default;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AttachmentsSection({ taskId }) {
  const { user } = useStore();
  const { data: attachments = [], isLoading } = useAttachments(taskId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    for (const file of files) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }

      try {
        await uploadAttachment.mutateAsync({ taskId, file });
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id, filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      await deleteAttachment.mutateAsync(id);
      toast.success('Attachment deleted');
    } catch (error) {
      toast.error('Failed to delete attachment');
    }
  };

  const handleDownload = (attachment) => {
    window.open(attachment.url, '_blank');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  return (
    <div className="mt-5 pt-5 border-t border-[#1e2640]">
      <h4 className="text-[12px] font-semibold text-[#8892a4] mb-3 flex items-center gap-2">
        <Paperclip size={14} />
        Attachments ({attachments.length})
      </h4>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 mb-3 text-center transition-colors ${
          isDragging
            ? 'border-[#6c8cff] bg-[rgba(108,140,255,0.1)]'
            : 'border-[#1e2640] hover:border-[#6c8cff]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files)}
          multiple
          className="hidden"
        />
        <Upload size={24} className="mx-auto mb-2 text-[#556]" />
        <p className="text-[12px] text-[#8892a4] mb-1">
          Drag & drop files here or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[#6c8cff] hover:underline"
          >
            browse
          </button>
        </p>
        <p className="text-[10px] text-[#556]">Max 10MB per file</p>
      </div>

      {/* Uploading indicator */}
      {uploadAttachment.isPending && (
        <div className="text-center text-[12px] text-[#6c8cff] mb-3">
          Uploading...
        </div>
      )}

      {/* Attachments List */}
      {isLoading ? (
        <div className="text-center text-[#8892a4] py-4">Loading...</div>
      ) : attachments.length === 0 ? (
        <div className="text-center text-[#556] py-2 text-[12px]">No attachments</div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.mimeType);
            const isImage = attachment.mimeType.startsWith('image/');

            return (
              <div
                key={attachment.id}
                className="bg-[#1a2035] border border-[#1e2640] rounded-lg p-3 flex items-center gap-3 group"
              >
                {/* Preview or Icon */}
                {isImage ? (
                  <img
                    src={attachment.url}
                    alt={attachment.originalName}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-[#253050] flex items-center justify-center">
                    <Icon size={20} className="text-[#8892a4]" />
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white truncate">
                    {attachment.originalName}
                  </p>
                  <p className="text-[10px] text-[#556]">
                    {formatFileSize(attachment.size)} •{' '}
                    {formatRelativeTime(attachment.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-1.5 text-[#8892a4] hover:text-[#6c8cff] transition-colors"
                  >
                    <Download size={14} />
                  </button>
                  {(attachment.uploadedBy === user?.id || user?.role === 'ADMIN') && (
                    <button
                      onClick={() => handleDelete(attachment.id, attachment.originalName)}
                      className="p-1.5 text-[#8892a4] hover:text-[#ef4444] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
