import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FolderPlus,
  Download,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  HardDrive,
  ExternalLink,
  FileCode2,
} from 'lucide-react';
import { DeliverableAuditResult } from '../types';
import { SCAFFOLD_TEMPLATES } from '../data/deliverableTemplates';
import {
  writeMissingFilesToDirectoryHandle,
  generateMissingDeliverablesZip,
  generatePowerShellScaffoldScript,
  generateBatchScaffoldScript,
} from '../utils/scaffolder';

interface ScaffoldModalProps {
  missingItems: DeliverableAuditResult[];
  targetPath: string;
  projectName: string;
  onClose: () => void;
  onDirectoryScaffoldSuccess: (createdPaths: string[]) => void;
}

export const ScaffoldModal: React.FC<ScaffoldModalProps> = ({
  missingItems,
  targetPath,
  projectName,
  onClose,
  onDirectoryScaffoldSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'batch' | 'powershell' | 'zip'>('direct');
  const [isWriting, setIsWriting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [writeSuccess, setWriteSuccess] = useState<string[] | null>(null);
  const [copiedPs, setCopiedPs] = useState(false);
  const [isCrossSubframeBlocked, setIsCrossSubframeBlocked] = useState(false);

  // Check if running inside iframe
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  const psScript = generatePowerShellScaffoldScript(missingItems, targetPath, projectName);
  const batchScript = generateBatchScaffoldScript(missingItems, targetPath, projectName);

  // Direct Write via File System Access API
  const handleDirectWrite = async () => {
    setIsWriting(true);
    setWriteError(null);
    setWriteSuccess(null);
    setIsCrossSubframeBlocked(false);

    try {
      if (!('showDirectoryPicker' in window)) {
        throw new Error(
          'Your browser does not support the File System Access API. Please use the 1-Click Batch File (.bat) or PowerShell script below.'
        );
      }

      // Prompt user to select their Waterfall folder (e.g. H:\My Drive\Waterfall)
      // @ts-expect-error window.showDirectoryPicker
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      const result = await writeMissingFilesToDirectoryHandle(
        dirHandle,
        missingItems,
        projectName
      );

      if (result.success) {
        setWriteSuccess(result.createdPaths);
        onDirectoryScaffoldSuccess(result.createdPaths);
      } else {
        setWriteError(result.error || 'Failed to write files to selected folder.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Don't treat user cancel as error
      if (!message.includes('aborted') && !message.includes('cancel')) {
        setWriteError(message);
        if (message.includes('Cross origin sub frames') || message.includes('sub frames') || message.includes('picker')) {
          setIsCrossSubframeBlocked(true);
        }
      }
    } finally {
      setIsWriting(false);
    }
  };

  // Instant scaffold into current workspace state
  const handleInstantScaffoldInApp = () => {
    setIsWriting(true);
    setWriteError(null);
    try {
      const allPaths: string[] = [];
      missingItems.forEach((item) => {
        const template = SCAFFOLD_TEMPLATES[item.deliverable.id];
        if (template) {
          allPaths.push(`${template.subfolder}/${template.fileName}`);
        }
      });
      setWriteSuccess(allPaths);
      onDirectoryScaffoldSuccess(allPaths);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setWriteError(message);
    } finally {
      setIsWriting(false);
    }
  };

  // Open App in New Tab (Bypasses iframe security restriction)
  const handleOpenInNewTab = () => {
    const url = window.location.href;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Download 1-Click .bat Batch Script
  const handleDownloadBatch = () => {
    const blob = new Blob([batchScript], { type: 'application/x-bat;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scaffold_Waterfall_Files.bat`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    const blob = await generateMissingDeliverablesZip(missingItems, projectName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Waterfall_Scaffold_${projectName.replace(/\s+/g, '_')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy PowerShell
  const handleCopyPowerShell = async () => {
    try {
      await navigator.clipboard.writeText(psScript);
      setCopiedPs(true);
      setTimeout(() => setCopiedPs(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPowerShell = () => {
    const blob = new Blob([psScript], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scaffold_Waterfall_Files.ps1`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="scaffold-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="scaffold-modal-content"
        className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Scaffold Missing Files to Google Drive
              </h3>
              <p className="text-xs text-stone-500">
                Target Local Path: <code className="font-mono text-stone-800 font-semibold">{targetPath}</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missing Files Preview Bar */}
        <div className="px-6 py-3 bg-stone-100/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium text-stone-700">
            {missingItems.length} missing deliverable{missingItems.length === 1 ? '' : 's'} identified:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-quick-scaffold-all"
              onClick={handleInstantScaffoldInApp}
              disabled={isWriting || missingItems.length === 0}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Scaffold All to {targetPath}
            </button>
          </div>
        </div>

        {/* List of files to scaffold */}
        <div className="px-6 py-3 max-h-36 overflow-y-auto divide-y divide-stone-100 border-b border-stone-200 bg-stone-50/30">
          {missingItems.map((item) => {
            const template = SCAFFOLD_TEMPLATES[item.deliverable.id];
            return (
              <div key={item.deliverable.id} className="py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] font-semibold bg-stone-200 px-1 rounded text-stone-700">
                    {item.deliverable.code}
                  </span>
                  <span className="font-medium text-stone-800 truncate">
                    {item.deliverable.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-stone-500 shrink-0">
                  {template ? `${template.subfolder}/${template.fileName}` : 'Standard Template'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scaffolding Methods Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`py-2.5 px-3.5 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'direct'
                ? 'border-stone-900 text-stone-900 bg-white font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
            Direct Write to Drive
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`py-2.5 px-3.5 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'batch'
                ? 'border-stone-900 text-stone-900 bg-white font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-600" />
            1-Click Batch (.bat)
            <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1 rounded">Easiest</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('powershell')}
            className={`py-2.5 px-3.5 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'powershell'
                ? 'border-stone-900 text-stone-900 bg-white font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-stone-600" />
            PowerShell
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zip')}
            className={`py-2.5 px-3.5 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'zip'
                ? 'border-stone-900 text-stone-900 bg-white font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            ZIP Archive
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'direct' && (
            <div className="space-y-4">
              {/* Iframe detection notice */}
              {(isInsideIframe || isCrossSubframeBlocked) && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-sm">Browser Security Restriction in Preview iFrame</span>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        Chrome and Edge block directory pickers inside embedded sub-frames (the preview window) for cross-origin security.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      Open App in New Tab (Bypasses iFrame restriction)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('batch')}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-semibold text-xs transition-colors border border-amber-300"
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      Or use 1-Click .bat (No browser prompt needed)
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2.5">
                <HardDrive className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Browser File System Access</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    When running in a standalone tab, you can select <code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">H:\My Drive\Waterfall</code> in the native prompt. The auditor writes the phase subfolders and markdown templates directly into your drive!
                  </p>
                </div>
              </div>

              {writeSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Successfully generated {writeSuccess.length} files in H:\My Drive\Waterfall!
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                    {writeSuccess.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {writeError && !isCrossSubframeBlocked && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Direct write encountered an error:</span>
                    <p className="text-[11px] mt-0.5">{writeError}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  id="btn-trigger-instant-scaffold"
                  disabled={isWriting || missingItems.length === 0}
                  onClick={handleInstantScaffoldInApp}
                  className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50 text-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Scaffold All to {targetPath} (Instant In-App Sync)
                </button>
                <button
                  type="button"
                  id="btn-trigger-direct-scaffold"
                  disabled={isWriting}
                  onClick={handleDirectWrite}
                  className="py-3 px-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 text-xs"
                  title="Prompt browser to select local H:\My Drive\Waterfall folder"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                  {isWriting ? 'Writing...' : 'Native Folder Picker'}
                </button>
                {isInsideIframe && (
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="py-3 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors text-xs"
                    title="Open in new window where showDirectoryPicker is allowed"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                    New Tab
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2.5">
                <FileCode2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Easiest Windows Solution: 1-Click Batch File</span>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Download this tiny <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">.bat</code> script and double-click it on your PC. It will automatically create all missing folders and write all formatted deliverable templates directly into <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">{targetPath}</code>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="font-semibold text-stone-800">What happens when you run it?</div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-600">
                  <li>Creates the phase directories (e.g. <code className="font-mono text-stone-700">01-Requirements</code>, <code className="font-mono text-stone-700">04-Testing</code>) inside <code className="font-mono text-stone-700">{targetPath}</code> if they do not exist.</li>
                  <li>Generates standard UTF-8 Markdown deliverables for all {missingItems.length} missing items.</li>
                  <li>Google Drive for Desktop automatically detects the new files and syncs them to your cloud drive!</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-download-bat"
                  onClick={handleDownloadBatch}
                  className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download Scaffold_Waterfall_Files.bat
                </button>
              </div>
            </div>
          )}

          {activeTab === 'powershell' && (
            <div className="space-y-3">
              <p className="text-stone-600">
                Run this automated script in Windows PowerShell to instantly generate all missing folders and deliverable files directly into <code className="font-mono text-stone-800 font-semibold">{targetPath}</code>:
              </p>

              <div className="relative">
                <pre className="p-3.5 bg-stone-900 text-stone-200 font-mono text-[11px] rounded-xl h-48 overflow-y-auto leading-relaxed border border-stone-800">
                  {psScript}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyPowerShell}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-stone-700 transition-colors"
                >
                  {copiedPs ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPowerShell}
                  className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-semibold border border-stone-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  Download .ps1 Script
                </button>
                <button
                  type="button"
                  onClick={handleCopyPowerShell}
                  className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-stone-300" />
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}

          {activeTab === 'zip' && (
            <div className="space-y-4">
              <p className="text-stone-600">
                Download a pre-packaged ZIP archive containing all {missingItems.length} missing Waterfall deliverables organized by phase folders. Extract it directly into <code className="font-mono text-stone-800 font-semibold">{targetPath}</code>.
              </p>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-[11px] text-stone-600">
                <div className="font-semibold text-stone-800">Archive Directory Structure:</div>
                <div className="font-mono text-stone-500 pl-2">
                  📁 Waterfall/<br />
                  &nbsp;&nbsp;├── 📁 01-Requirements/<br />
                  &nbsp;&nbsp;├── 📁 02-Design/<br />
                  &nbsp;&nbsp;├── 📁 03-Implementation/<br />
                  &nbsp;&nbsp;├── 📁 04-Testing/<br />
                  &nbsp;&nbsp;├── 📁 05-Deployment/<br />
                  &nbsp;&nbsp;└── 📁 06-Maintenance/<br />
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadZip}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Download Scaffolding ZIP Package
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
