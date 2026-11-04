import React, { useState, useRef } from 'react';
import {
  Paperclip,
  Plus,
  Download,
  Eye,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  FileCode,
  File,
  Lock,
} from 'lucide-react';
import { StepAttachment } from '../types';
import {
  getFileCategory,
  formatFileSize,
  getCategoryBadgeStyles,
  downloadAttachment,
  readFileAsAttachment,
} from '../utils/attachmentUtils';
import { FileViewerModal } from './FileViewerModal';

interface StepAttachmentsManagerProps {
  stepId: string;
  stepNumber: number;
  stepTitle: string;
  attachments?: StepAttachment[];
  currentUserName: string;
  currentUserRole: 'FRC Owner' | 'Analyst';
  onAddAttachments: (stepId: string, newAttachments: StepAttachment[]) => void;
  onRemoveAttachment?: (stepId: string, attachmentId: string) => void;
  isReadOnly?: boolean;
  compact?: boolean;
}

export const StepAttachmentsManager: React.FC<StepAttachmentsManagerProps> = ({
  stepId,
  stepTitle,
  attachments = [],
  currentUserName,
  currentUserRole,
  onAddAttachments,
  onRemoveAttachment,
  isReadOnly = false,
  compact = false,
}) => {
  const [isDropActive, setIsDropActive] = useState<boolean>(false);
  const [inspectingAttachment, setInspectingAttachment] = useState<StepAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderCategoryIcon = (ext: string, className = 'w-4 h-4') => {
    const cat = getFileCategory(ext);
    switch (cat) {
      case 'pdf':
        return <FileText className={`${className} text-rose-600`} />;
      case 'excel':
        return <FileSpreadsheet className={`${className} text-emerald-600`} />;
      case 'word':
        return <FileText className={`${className} text-blue-600`} />;
      case 'ppt':
        return <Presentation className={`${className} text-amber-600`} />;
      case 'image':
        return <ImageIcon className={`${className} text-purple-600`} />;
      case 'code':
        return <FileCode className={`${className} text-cyan-600`} />;
      default:
        return <File className={`${className} text-stone-600`} />;
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: StepAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const att = await readFileAsAttachment(files[i], currentUserName, currentUserRole);
        newAttachments.push(att);
      } catch (err) {
        console.error('Failed to read file attachment', err);
      }
    }

    if (newAttachments.length > 0) {
      onAddAttachments(stepId, newAttachments);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadOnly) {
      setIsDropActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropActive(false);
    if (isReadOnly) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  if (compact) {
    return (
      <div
        className={`flex flex-col gap-1.5 transition-all p-1 rounded-lg ${
          isDropActive ? 'bg-emerald-50 ring-2 ring-emerald-400' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.svg,.txt,.sql,.zip"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* Existing attachment chips */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {attachments.map((att) => {
              const cat = getFileCategory(att.extension);
              const styles = getCategoryBadgeStyles(cat);
              return (
                <div
                  key={att.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium bg-white ${styles.badgeBorder} shadow-2xs hover:bg-stone-50 transition-colors`}
                  title={`${att.name} (${formatFileSize(att.size)}) • Uploaded by ${att.uploadedBy}`}
                >
                  {renderCategoryIcon(att.extension, 'w-3 h-3')}
                  <button
                    type="button"
                    onClick={() => setInspectingAttachment(att)}
                    className="max-w-[100px] truncate text-stone-800 hover:text-stone-950 hover:underline font-medium text-left"
                  >
                    {att.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(att)}
                    className="p-0.5 text-stone-400 hover:text-emerald-700 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Compact drag & drop upload tab with + icon */}
        {!isReadOnly ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100/90 px-2.5 py-1 rounded-md border border-dashed border-emerald-300 transition-colors w-full justify-center shadow-2xs"
            title="Click here or drag files to upload (PDF, Excel, Word, PPT, Images)"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Click here or drag files to upload</span>
          </button>
        ) : attachments.length === 0 ? (
          <span className="text-[10px] text-stone-400 italic">No files attached</span>
        ) : null}

        {inspectingAttachment && (
          <FileViewerModal
            attachment={inspectingAttachment}
            onClose={() => setInspectingAttachment(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200/90 bg-stone-50/50 p-3 space-y-2.5">
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.svg,.txt,.sql,.zip"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* Top Bar: Title & Status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5 text-stone-600" />
          <span className="text-xs font-bold text-stone-800">
            Step Attachments
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-stone-200/80 text-stone-700">
            {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
          </span>
          <span className="text-[10px] text-stone-400 font-medium">
            (PDF, Excel, Images, Word, PPT)
          </span>
        </div>

        {isReadOnly && (
          <span className="text-[11px] text-stone-400 italic flex items-center gap-1">
            <Lock className="w-3 h-3" /> View/Download only
          </span>
        )}
      </div>

      {/* Attachments List (if any files exist) */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {attachments.map((att) => {
            const cat = getFileCategory(att.extension);
            const styles = getCategoryBadgeStyles(cat);
            return (
              <div
                key={att.id}
                className="bg-white rounded-xl border border-stone-200 p-2.5 shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${styles.iconBg}`}>
                    {renderCategoryIcon(att.extension, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setInspectingAttachment(att)}
                      className="text-xs font-bold text-stone-900 hover:text-stone-700 hover:underline block truncate text-left w-full"
                      title={att.name}
                    >
                      {att.name}
                    </button>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder}`}
                      >
                        {styles.label}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {formatFileSize(att.size)}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 truncate mt-0.5">
                      By {att.uploadedBy} • {att.uploadedByRole}
                    </div>
                  </div>
                </div>

                {/* Card Actions: View & Download */}
                <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setInspectingAttachment(att)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
                      title="Preview file"
                    >
                      <Eye className="w-3 h-3 text-stone-500" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadAttachment(att)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                      title="Download original file"
                    >
                      <Download className="w-3 h-3 text-emerald-600" />
                      Download
                    </button>
                  </div>

                  {!isReadOnly && onRemoveAttachment && (
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(stepId, att.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drag and Drop Tab with + icon: "Click here or drag files to upload" */}
      {!isReadOnly ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer select-none flex items-center justify-center gap-2.5 ${
            isDropActive
              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300'
              : 'border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-white'
          }`}
          title="Click here or drag files to upload"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-stone-800 hover:text-emerald-800 transition-colors">
              Click here or drag files to upload
            </p>
            <p className="text-[10px] text-stone-500">
              Accepts PDF, Excel (.xlsx, .csv), Word (.docx), PowerPoint (.pptx), Images (.png, .jpg)
            </p>
          </div>
        </div>
      ) : attachments.length === 0 ? (
        <div className="border border-dashed border-stone-200 rounded-lg p-3 text-center bg-stone-50/50">
          <p className="text-xs text-stone-400 italic">No supporting files attached to this step.</p>
        </div>
      ) : null}

      {/* Modal for Viewing / Previewing File */}
      {inspectingAttachment && (
        <FileViewerModal
          attachment={inspectingAttachment}
          onClose={() => setInspectingAttachment(null)}
        />
      )}
    </div>
  );
};
