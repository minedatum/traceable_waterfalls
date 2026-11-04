import React, { useRef } from 'react';
import {
  X,
  FileCheck,
  Calendar,
  Layers,
  FileQuestion,
  AlertTriangle,
  Upload,
  HardDrive,
  GitBranch,
} from 'lucide-react';
import { DeliverableAuditResult } from '../types';
import { formatBytes } from '../utils/auditor';

interface DeliverableModalProps {
  item: DeliverableAuditResult | null;
  onClose: () => void;
  onAttachFile: (deliverableId: string, file: File) => void;
}

export const DeliverableModal: React.FC<DeliverableModalProps> = ({
  item,
  onClose,
  onAttachFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!item) return null;

  const { deliverable, matchedFile, status, reason, daysOld, dependencyStatus } = item;

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAttachFile(deliverable.id, e.target.files[0]);
    }
  };

  return (
    <div
      id="deliverable-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="deliverable-detail-modal-content"
        className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-start justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-stone-700 bg-stone-200 px-2 py-0.5 rounded">
                {deliverable.code}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Phase: {deliverable.phaseId.toUpperCase()}
              </span>
              {deliverable.isMandatory ? (
                <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-medium">
                  Mandatory Gate Deliverable
                </span>
              ) : (
                <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-medium">
                  Optional
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-stone-900 tracking-tight">
              {deliverable.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              status === 'up-to-date'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : status === 'outdated'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            {status === 'up-to-date' && <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {status === 'outdated' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {status === 'missing' && <FileQuestion className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}

            <div className="text-xs">
              <span className="font-semibold block mb-0.5">
                {status === 'up-to-date'
                  ? 'Audit Passed: Deliverable Up to Date'
                  : status === 'outdated'
                  ? 'Audit Warning: Outdated File'
                  : 'Audit Failed: Deliverable Missing'}
              </span>
              <span>{reason}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-1">
              Specification Description
            </label>
            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
              {deliverable.description}
            </p>
          </div>

          {/* Matched File Breakdown */}
          {matchedFile ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-800 border-b border-stone-200 pb-2">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-stone-500" />
                  Matched Project File
                </span>
                <span className="text-stone-500 font-mono text-[11px]">
                  .{matchedFile.extension.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-400 block text-[11px]">File Name</span>
                  <span className="font-mono text-stone-800 font-medium break-all">
                    {matchedFile.name}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">File Size</span>
                  <span className="text-stone-800">{formatBytes(matchedFile.size)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Relative Path</span>
                  <span className="text-stone-700 font-mono text-[11px] break-all">
                    {matchedFile.path}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Last Modified</span>
                  <span className="text-stone-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {new Date(matchedFile.lastModified).toLocaleDateString()} ({daysOld}d ago)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-4 text-center">
              <FileQuestion className="w-8 h-8 text-stone-300 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-stone-700">No matching file was detected</p>
              <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto">
                File scan looked for patterns like:
              </p>
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {deliverable.patterns.map((pat) => (
                  <span
                    key={pat}
                    className="font-mono text-[10px] bg-white border border-stone-200 px-1.5 py-0.5 rounded text-stone-600"
                  >
                    *{pat}*
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Precursor Dependencies */}
          {deliverable.dependsOn && deliverable.dependsOn.length > 0 && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-stone-700 mb-1.5">
                <GitBranch className="w-4 h-4 text-stone-500" />
                Waterfall Phase Dependency
              </div>
              <p className="text-[11px] text-stone-600">
                In strict Waterfall sequence, this milestone depends on deliverables:
                <span className="font-mono font-medium ml-1">
                  {deliverable.dependsOn.join(', ')}
                </span>
              </p>
              {dependencyStatus && !dependencyStatus.isSatisfied && (
                <div className="mt-1.5 text-rose-600 font-medium text-[11px]">
                  ⚠️ {dependencyStatus.note}
                </div>
              )}
            </div>
          )}

          {/* Quick upload replacement */}
          <div className="pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleManualUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-stone-600" />
              {matchedFile ? 'Upload Newer Version / Replace File' : 'Fulfill Deliverable: Upload File'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
