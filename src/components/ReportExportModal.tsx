import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Printer } from 'lucide-react';
import { ProjectAuditReport } from '../types';
import { generateMarkdownReport } from '../utils/auditor';

interface ReportExportModalProps {
  report: ProjectAuditReport;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ report, onClose }) => {
  const [copied, setCopied] = useState(false);
  const markdownText = generateMarkdownReport(report);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.projectName.replace(/\s+/g, '_')}_Waterfall_Audit.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.projectName.replace(/\s+/g, '_')}_Waterfall_Audit.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="report-export-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="report-export-modal-content"
        className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-700" />
            <h3 className="text-base font-semibold text-stone-900">
              Export Waterfall Audit Report
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-stone-600">
            Export a comprehensive audit checklist and phase gate readiness assessment for
            stakeholders, engineering leads, and compliance audits.
          </p>

          <div className="relative">
            <pre className="p-4 bg-stone-900 text-stone-200 font-mono text-xs rounded-xl h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
              {markdownText}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-3 right-3 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-stone-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              Download .MD
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              Download .JSON
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-stone-300" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
