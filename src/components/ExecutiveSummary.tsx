import React from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  Clock,
  FileQuestion,
  Files,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { ProjectAuditReport } from '../types';

interface ExecutiveSummaryProps {
  report: ProjectAuditReport;
  onFilterStatus: (status: string) => void;
  onOpenScaffold?: () => void;
  targetPath?: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  report,
  onFilterStatus,
  onOpenScaffold,
  targetPath = 'H:\\My Drive\\Waterfall',
}) => {
  const isBlocked = report.overallGateStatus === 'BLOCKED';
  const isWarning = report.overallGateStatus === 'WARNING';

  return (
    <section id="executive-summary-section" className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Health & Gate Status */}
        <div
          id="card-metric-health"
          className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-2">
            <span>Waterfall Audit Score</span>
            {isBlocked ? (
              <span className="flex items-center text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold">
                <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                Gate Blocked
              </span>
            ) : isWarning ? (
              <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Attention Needed
              </span>
            ) : (
              <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Gate Cleared
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-stone-900">
              {report.overallScore}%
            </span>
            <span className="text-xs text-stone-500">
              ({report.presentDeliverables} of {report.totalDeliverables} requirements)
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                report.overallScore >= 85
                  ? 'bg-emerald-500'
                  : report.overallScore >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, report.overallScore))}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Missing Deliverables */}
        <button
          type="button"
          id="card-metric-missing"
          onClick={() => onFilterStatus('missing')}
          className="bg-white hover:bg-stone-50 border border-stone-200 rounded-xl p-4 shadow-2xs text-left transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-2">
            <span className="flex items-center">
              <FileQuestion className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              Missing Deliverables
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-rose-600">
              {report.missingDeliverables}
            </span>
            <span className="text-xs text-stone-500">deliverables not found</span>
          </div>
          <p className="text-xs text-stone-500 mt-2 line-clamp-1">
            {report.missingDeliverables === 0
              ? 'All required documents located'
              : 'Mandatory sign-offs or specs absent'}
          </p>
        </button>

        {/* Metric 3: Outdated / Stale Files */}
        <button
          type="button"
          id="card-metric-outdated"
          onClick={() => onFilterStatus('outdated')}
          className="bg-white hover:bg-stone-50 border border-stone-200 rounded-xl p-4 shadow-2xs text-left transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-2">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Outdated / Stale Files
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-amber-600">
              {report.outdatedDeliverables}
            </span>
            <span className="text-xs text-stone-500">exceed freshness age</span>
          </div>
          <p className="text-xs text-stone-500 mt-2 line-clamp-1">
            {report.outdatedDeliverables === 0
              ? 'All documents within freshness limits'
              : 'Requires review against latest baseline'}
          </p>
        </button>

        {/* Metric 4: Total Files & Extra files */}
        <button
          type="button"
          id="card-metric-files"
          onClick={() => onFilterStatus('unmatched')}
          className="bg-white hover:bg-stone-50 border border-stone-200 rounded-xl p-4 shadow-2xs text-left transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-2">
            <span className="flex items-center">
              <Files className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
              Scanned Folder Assets
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-stone-800">
              {report.totalFilesScanned}
            </span>
            <span className="text-xs text-stone-500">
              ({report.unmatchedFiles.length} extra / unclassified)
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2 line-clamp-1">
            Click to inspect non-standard folder items
          </p>
        </button>
      </div>

      {/* Critical Blocker Alert Banner if any gate blocked */}
      {isBlocked && (
        <div
          id="alert-waterfall-blocker"
          className="mt-4 p-4 bg-rose-50/90 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900">
              <span className="font-semibold">Waterfall Gate Integrity Warning: </span>
              Phase progression is blocked due to {report.missingDeliverables} missing deliverable{report.missingDeliverables === 1 ? '' : 's'}. In formal Waterfall governance, downstream phases cannot proceed without required documentation and sign-offs.
              <div className="text-[11px] text-rose-700 mt-0.5">
                Target location: <code className="font-mono font-semibold">{targetPath}</code>
              </div>
            </div>
          </div>

          {onOpenScaffold && report.missingDeliverables > 0 && (
            <button
              type="button"
              id="btn-alert-scaffold"
              onClick={onOpenScaffold}
              className="inline-flex items-center justify-center px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Scaffold Missing Files
            </button>
          )}
        </div>
      )}
    </section>
  );
};
