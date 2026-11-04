import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  FileCode,
  File,
  Check,
  Copy,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { StepAttachment } from '../types';
import {
  getFileCategory,
  formatFileSize,
  getCategoryBadgeStyles,
  downloadAttachment,
} from '../utils/attachmentUtils';

interface FileViewerModalProps {
  attachment: StepAttachment | null;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  attachment,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!attachment) return null;

  const category = getFileCategory(attachment.extension);
  const badgeStyles = getCategoryBadgeStyles(category);

  const renderIcon = () => {
    switch (category) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
      case 'word':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'ppt':
        return <Presentation className="w-6 h-6 text-amber-600" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-purple-600" />;
      case 'code':
        return <FileCode className="w-6 h-6 text-cyan-600" />;
      default:
        return <File className="w-6 h-6 text-stone-600" />;
    }
  };

  const handleDownload = () => {
    downloadAttachment(attachment);
  };

  const handleCopySummary = () => {
    const text = `Deliverable Attachment: ${attachment.name}\nSize: ${formatFileSize(
      attachment.size
    )}\nCategory: ${category.toUpperCase()}\nUploaded By: ${attachment.uploadedBy} (${
      attachment.uploadedByRole
    })\nTimestamp: ${attachment.uploadedAt}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-4 bg-stone-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-xl shrink-0 ${badgeStyles.iconBg}`}>
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-stone-900 truncate">
                  {attachment.name}
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeStyles.badgeBg} ${badgeStyles.badgeText} ${badgeStyles.badgeBorder}`}
                >
                  {badgeStyles.label} (.{attachment.extension.toUpperCase()})
                </span>
                <span className="text-xs font-semibold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                <span>Uploaded by <strong className="text-stone-700">{attachment.uploadedBy}</strong> ({attachment.uploadedByRole})</span>
                <span>•</span>
                <span>{new Date(attachment.uploadedAt).toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Download file to your local computer"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
              title="Copy file metadata summary"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-stone-100/50 flex flex-col items-center justify-center">
          {/* Images */}
          {category === 'image' && (
            <div className="flex flex-col items-center justify-center w-full space-y-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="p-1 hover:bg-stone-100 rounded text-stone-600"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-semibold text-stone-700 min-w-12 text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                  className="p-1 hover:bg-stone-100 rounded text-stone-600"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 px-2 py-0.5 border-l border-stone-200"
                >
                  Reset
                </button>
              </div>

              <div className="max-w-full overflow-auto bg-stone-900/5 p-4 rounded-xl border border-stone-200 flex items-center justify-center min-h-[300px]">
                {attachment.dataUrl ? (
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    style={{ width: `${zoomLevel}%` }}
                    className="max-h-[60vh] object-contain rounded-lg shadow-md transition-all duration-150"
                  />
                ) : (
                  <div className="text-center p-8 text-stone-500">
                    <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs">No image preview stream available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {category === 'pdf' && (
            <div className="w-full flex flex-col space-y-3">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Interactive PDF Preview: Regulatory Scope &amp; Specification Document</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="font-bold underline hover:text-rose-950 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Full PDF
                </button>
              </div>
              <div className="w-full h-[60vh] bg-white rounded-xl border border-stone-200 overflow-hidden shadow-inner flex items-center justify-center">
                {attachment.dataUrl ? (
                  <iframe
                    src={attachment.dataUrl}
                    title={attachment.name}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="text-center p-8 text-stone-500">
                    <FileText className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs">PDF stream ready for download</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Excel / CSV Spreadsheet Preview */}
          {category === 'excel' && (
            <div className="w-full flex flex-col space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Structured Spreadsheet Preview: In-Scope Records &amp; Filtered Balances</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="font-bold underline hover:text-emerald-950 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Workbook (.xlsx)
                </button>
              </div>

              {/* Formatted Spreadsheet Sheet Container */}
              <div className="w-full bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
                {/* Excel style formula bar */}
                <div className="bg-stone-50 px-4 py-2 border-b border-stone-200 flex items-center gap-3 text-xs text-stone-600 font-mono">
                  <span className="font-bold text-stone-400">fx</span>
                  <span className="text-stone-800 truncate">
                    =FILTER(EDW_MASTER_ACCOUNTS, EXCLUSION_FLAG = "NO" AND ACTIVE_FY2024 = 1)
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-mono text-[11px]">
                        <th className="py-2 px-3 border-r border-stone-200 w-12 text-center bg-stone-200/50">#</th>
                        <th className="py-2 px-3 border-r border-stone-200">Account_Number</th>
                        <th className="py-2 px-3 border-r border-stone-200">Client_Legal_Name</th>
                        <th className="py-2 px-3 border-r border-stone-200">Product_Type</th>
                        <th className="py-2 px-3 border-r border-stone-200">Open_Date</th>
                        <th className="py-2 px-3 border-r border-stone-200 text-right">Current_Balance ($)</th>
                        <th className="py-2 px-3 border-r border-stone-200 text-center">In_Scope</th>
                        <th className="py-2 px-3">Exclusion_Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-[11px] text-stone-700">
                      <tr className="hover:bg-emerald-50/30">
                        <td className="py-2 px-3 border-r border-stone-200 text-center text-stone-400 bg-stone-50">1</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-bold text-stone-900">ACC-1002931</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Horizon Logistics LLC</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Commercial Credit</td>
                        <td className="py-2 px-3 border-r border-stone-200">2022-04-15</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-right font-bold">$450,000.00</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-center"><span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">YES</span></td>
                        <td className="py-2 px-3 text-stone-400 italic">None (In-Scope)</td>
                      </tr>
                      <tr className="hover:bg-emerald-50/30">
                        <td className="py-2 px-3 border-r border-stone-200 text-center text-stone-400 bg-stone-50">2</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-bold text-stone-900">ACC-1002932</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Vanguard Retail Inc</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Business Line</td>
                        <td className="py-2 px-3 border-r border-stone-200">2023-01-10</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-right font-bold">$125,000.50</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-center"><span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">YES</span></td>
                        <td className="py-2 px-3 text-stone-400 italic">None (In-Scope)</td>
                      </tr>
                      <tr className="hover:bg-rose-50/30 bg-rose-50/10">
                        <td className="py-2 px-3 border-r border-stone-200 text-center text-stone-400 bg-stone-50">3</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-bold text-rose-800">ACC-9999001</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">QA Automated Test Stub</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Sandbox Test</td>
                        <td className="py-2 px-3 border-r border-stone-200">2024-02-01</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-right text-stone-400">$0.00</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-center"><span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-bold">EXCLUDED</span></td>
                        <td className="py-2 px-3 text-rose-700 font-medium">Employee / Sandbox Clearing</td>
                      </tr>
                      <tr className="hover:bg-emerald-50/30">
                        <td className="py-2 px-3 border-r border-stone-200 text-center text-stone-400 bg-stone-50">4</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-bold text-stone-900">ACC-1002934</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Sterling Asset Mgmt</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Commercial Term</td>
                        <td className="py-2 px-3 border-r border-stone-200">2021-11-20</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-right font-bold">$890,000.00</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-center"><span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">YES</span></td>
                        <td className="py-2 px-3 text-stone-400 italic">None (In-Scope)</td>
                      </tr>
                      <tr className="hover:bg-rose-50/30 bg-rose-50/10">
                        <td className="py-2 px-3 border-r border-stone-200 text-center text-stone-400 bg-stone-50">5</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-bold text-rose-800">ACC-9999002</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Branch 9999 Clearing</td>
                        <td className="py-2 px-3 border-r border-stone-200 font-sans">Suspense Ledger</td>
                        <td className="py-2 px-3 border-r border-stone-200">2024-03-12</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-right text-stone-400">$500.00</td>
                        <td className="py-2 px-3 border-r border-stone-200 text-center"><span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-bold">EXCLUDED</span></td>
                        <td className="py-2 px-3 text-rose-700 font-medium">Internal Branch Clearing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-stone-50 px-4 py-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Showing preview of 5 rows of 1,450,000 records</span>
                  <span className="font-semibold text-emerald-700">Workbook Ready for Full Export</span>
                </div>
              </div>
            </div>
          )}

          {/* Word / Document Preview */}
          {category === 'word' && (
            <div className="w-full flex flex-col space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Word Document Preview: Requirements &amp; Scoping Specifications</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="font-bold underline hover:text-blue-950 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download (.docx)
                </button>
              </div>

              <div className="w-full bg-white rounded-xl border border-stone-200 p-8 shadow-xs max-h-[55vh] overflow-y-auto space-y-4 text-xs text-stone-800 leading-relaxed font-sans">
                <div className="border-b border-stone-200 pb-3">
                  <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block mb-1">
                    ENTERPRISE GOVERNANCE &amp; SCOPING STANDARD
                  </span>
                  <h4 className="text-base font-bold text-stone-900">{attachment.name}</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Document Ref: REG-DOC-SPEC-2024 • Authored by {attachment.uploadedBy}
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold text-stone-900 text-sm">1. Purpose &amp; Scope</h5>
                  <p>
                    This document defines the technical rules, data lineage boundaries, and governance criteria
                    required for this waterfall step. Both Requirements lead and Lead Analyst must verify that
                    all queries execute against reconciled master tables.
                  </p>

                  <h5 className="font-bold text-stone-900 text-sm">2. Scoping Specifications</h5>
                  <ul className="list-disc list-inside space-y-1 text-stone-700 pl-2">
                    <li>Execute extract queries on Gold-layer data warehouse tables.</li>
                    <li>Verify exclusion totals against general ledger account balances.</li>
                    <li>Ensure dual-signoff is achieved prior to downstream production migration.</li>
                  </ul>

                  <h5 className="font-bold text-stone-900 text-sm">3. Audit &amp; Traceability Compliance</h5>
                  <p>
                    Every modification to this step must update the version audit log with a detailed rationale
                    explaining the scope variation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PowerPoint Presentation Preview */}
          {category === 'ppt' && (
            <div className="w-full flex flex-col space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <Presentation className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>PowerPoint Presentation Preview: Executive Scoping Deck</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="font-bold underline hover:text-amber-950 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download (.pptx)
                </button>
              </div>

              {/* 16:9 Presentation Slide Preview Frame */}
              <div className="w-full aspect-video max-h-[50vh] bg-stone-900 rounded-xl p-6 text-white flex flex-col justify-between shadow-lg border border-stone-800">
                <div>
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                      TRACEABLE WATERFALLS • EXECUTIVE BRIEFING
                    </span>
                    <span className="text-xs text-stone-400 font-mono">Slide 1 of 6</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-4">{attachment.name}</h3>
                  <p className="text-xs text-stone-300 mt-2 max-w-xl">
                    Comprehensive governance framework for scoping regulatory waterfalls, preventing scope dispute,
                    and tracking working days against business schedules.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-800/80">
                  <div className="bg-stone-800/80 p-2.5 rounded-lg border border-stone-700">
                    <span className="text-[10px] text-amber-400 block font-semibold">Deliverable</span>
                    <span className="text-xs font-bold text-stone-200 truncate block">{attachment.name}</span>
                  </div>
                  <div className="bg-stone-800/80 p-2.5 rounded-lg border border-stone-700">
                    <span className="text-[10px] text-amber-400 block font-semibold">Author</span>
                    <span className="text-xs font-bold text-stone-200 block">{attachment.uploadedBy}</span>
                  </div>
                  <div className="bg-stone-800/80 p-2.5 rounded-lg border border-stone-700">
                    <span className="text-[10px] text-amber-400 block font-semibold">Governance Status</span>
                    <span className="text-xs font-bold text-emerald-400 block">Signed Off &amp; Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code / Text / Script Preview */}
          {(category === 'code' || category === 'other') && (
            <div className="w-full flex flex-col space-y-3">
              <div className="bg-stone-100 border border-stone-200 rounded-xl p-3 flex items-center justify-between text-xs text-stone-800">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>File Content Stream: {attachment.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="font-bold underline hover:text-stone-950 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </button>
              </div>

              <div className="w-full bg-stone-900 text-stone-100 rounded-xl p-4 font-mono text-xs max-h-[50vh] overflow-y-auto border border-stone-800">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {`-- Traceable Waterfall Scoping Query Extract\n-- File: ${attachment.name}\n-- Uploaded by: ${attachment.uploadedBy} (${attachment.uploadedByRole})\n-- Timestamp: ${attachment.uploadedAt}\n\nSELECT\n    account_id,\n    client_name,\n    product_category,\n    current_balance_usd,\n    exclusion_flag\nFROM edw_master_accounts\nWHERE active_status = 'ACTIVE'\n  AND balance_date >= '2024-01-01'\nORDER BY current_balance_usd DESC;`}
                </pre>
              </div>
            </div>
          )}

          {/* Notes section if present */}
          {attachment.notes && (
            <div className="w-full mt-3 p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-700 flex items-start gap-2 shadow-2xs">
              <span className="font-bold text-stone-900 shrink-0">Attachment Note:</span>
              <span>{attachment.notes}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-stone-200 bg-white flex items-center justify-between">
          <span className="text-xs text-stone-500 font-mono">
            ID: {attachment.id}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Download Original File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
