import React, { useState } from 'react';
import {
  RotateCcw,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  Info,
  Scale,
  History,
  Layers,
  HelpCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { WaterfallRow, AuditLogEntry } from '../types';

interface DisputeResolutionCardsProps {
  rows: WaterfallRow[];
  auditLogs?: AuditLogEntry[];
  onOpenAuditLogs?: () => void;
  onFilterStepInLogs?: (stepId: string) => void;
  userRole?: 'frc' | 'analyst';
  className?: string;
}

export const DisputeResolutionCards: React.FC<DisputeResolutionCardsProps> = ({
  rows,
  auditLogs = [],
  onOpenAuditLogs,
  onFilterStepInLogs,
  userRole,
  className = '',
}) => {
  const [selectedDisputeModal, setSelectedDisputeModal] = useState<
    'rerun' | 'refinalize' | 'collaboration' | null
  >(null);

  // 1. Calculate Analytics Reruns
  const rerunDetails = rows.map((r) => {
    // Count from explicit rerunCount or audit logs
    const logReruns = auditLogs.filter(
      (l) => l.rowId === r.id && (l.eventType === 'analytics_rerun' || l.action.toLowerCase().includes('re-run'))
    ).length;
    const explicitReruns = typeof r.rerunCount === 'number' ? r.rerunCount : 0;
    const totalStepReruns = Math.max(explicitReruns, logReruns);
    return {
      row: r,
      rerunCount: totalStepReruns,
    };
  });

  const totalReruns = rerunDetails.reduce((sum, item) => sum + item.rerunCount, 0);
  const stepsWithReruns = rerunDetails.filter((item) => item.rerunCount > 0);

  // 2. Calculate Requirement Re-Finalizations (Scope Churn)
  const refinalizeDetails = rows.map((r) => {
    const frcVersions = r.versions ? r.versions.filter((v) => v.role === 'FRC Owner') : [];
    const versionChurn = Math.max(0, frcVersions.length - 1);
    const logRefinalizes = auditLogs.filter(
      (l) =>
        l.rowId === r.id &&
        (l.eventType === 'requirement_refinalized' ||
          l.action.toLowerCase().includes('re-finalized') ||
          (l.action.toLowerCase().includes('modified') && l.action.toLowerCase().includes('requirement')))
    ).length;
    const explicitRefinalize = typeof r.refinalizeCount === 'number' ? r.refinalizeCount : 0;
    const totalStepRefinalizes = Math.max(explicitRefinalize, versionChurn, logRefinalizes);
    return {
      row: r,
      refinalizeCount: totalStepRefinalizes,
      totalVersions: r.versions ? r.versions.length : 1,
    };
  });

  const totalRefinalizations = refinalizeDetails.reduce(
    (sum, item) => sum + item.refinalizeCount,
    0
  );
  const stepsWithRefinalizations = refinalizeDetails.filter((item) => item.refinalizeCount > 0);

  // Scope Stability Index (% of finalized steps that never needed re-finalization)
  const finalizedSteps = rows.filter(
    (r) =>
      r.status === 'step_finalized' ||
      r.status === 'in_analysis' ||
      r.status === 'ready_for_review' ||
      r.status === 'signed_off' ||
      r.requirementFinalizedAt ||
      r.emailTriggeredAt
  );
  const stableStepsCount = finalizedSteps.filter(
    (r) =>
      (refinalizeDetails.find((d) => d.row.id === r.id)?.refinalizeCount || 0) === 0
  ).length;
  const stabilityIndex =
    finalizedSteps.length > 0
      ? Math.round((stableStepsCount / finalizedSteps.length) * 100)
      : 100;

  return (
    <div id="dispute-resolution-cards" className={`space-y-3 ${className}`}>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ========================================================================= */}
        {/* CARD 1: ANALYTICS RERUNS (Execution Iterations Counter) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Analytics Reruns Counter
                  </span>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                    Analytical Rework &amp; Re-executions
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDisputeModal('rerun')}
                className="text-stone-400 hover:text-blue-600 p-1"
                title="Explain dispute resolution role"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Big Stat */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-950 font-mono">
                {totalReruns}
              </span>
              <span className="text-xs text-stone-600 font-medium">
                {totalReruns === 1 ? 'total rerun iteration' : 'total rerun iterations'}
              </span>
              {totalReruns > 0 ? (
                <span className="ml-auto text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                  {stepsWithReruns.length} {stepsWithReruns.length === 1 ? 'step affected' : 'steps affected'}
                </span>
              ) : (
                <span className="ml-auto text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Zero rework
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Tracks how many times steps had to be re-run in analytics due to changed assumptions, data shifts, or criteria updates.
            </p>

            {/* Step Breakdown Badges */}
            <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Rerun Breakdown per Step:
              </span>
              {stepsWithReruns.length === 0 ? (
                <p className="text-xs text-stone-400 italic">
                  No steps have required analytical reruns.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {stepsWithReruns.map(({ row, rerunCount }) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => onFilterStepInLogs && onFilterStepInLogs(row.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
                      title={`Click to inspect audit trail for ${row.id}`}
                    >
                      <span className="font-mono font-bold">{row.id}</span>
                      <span className="bg-blue-200/80 text-blue-950 px-1 rounded text-[10px]">
                        {rerunCount} {rerunCount === 1 ? 'rerun' : 'reruns'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              Dispute Evidence: <strong>Rework Accountability</strong>
            </span>
            <button
              type="button"
              onClick={onOpenAuditLogs}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              Inspect Logs
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: REQUIREMENT RE-FINALIZATIONS (Scope Churn Counter) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 border border-indigo-200">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Requirement Re-Finalizations
                  </span>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                    Post-Lock Scope Churn &amp; Renegotiations
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDisputeModal('refinalize')}
                className="text-stone-400 hover:text-indigo-600 p-1"
                title="Explain dispute resolution role"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Big Stat */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-950 font-mono">
                {totalRefinalizations}
              </span>
              <span className="text-xs text-stone-600 font-medium">
                {totalRefinalizations === 1 ? 're-finalization event' : 're-finalization events'}
              </span>
              <span
                className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  stabilityIndex >= 85
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-900 border-amber-200'
                }`}
              >
                {stabilityIndex}% Scope Stability
              </span>
            </div>

            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Tracks how many times requirements kept getting re-finalized after initial lock, capturing scope modifications by FRC.
            </p>

            {/* Step Breakdown Badges */}
            <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Re-Finalized Steps Breakdown:
              </span>
              {stepsWithRefinalizations.length === 0 ? (
                <p className="text-xs text-stone-400 italic">
                  All requirements remain on baseline without post-lock churn.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {stepsWithRefinalizations.map(({ row, refinalizeCount, totalVersions }) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => onFilterStepInLogs && onFilterStepInLogs(row.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors"
                      title={`Click to inspect version changes for ${row.id}`}
                    >
                      <span className="font-mono font-bold">{row.id}</span>
                      <span className="bg-indigo-200/80 text-indigo-950 px-1 rounded text-[10px]">
                        v{totalVersions} ({refinalizeCount} re-finalized)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              Dispute Evidence: <strong>Scope Change Proof</strong>
            </span>
            <button
              type="button"
              onClick={onOpenAuditLogs}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
            >
              Inspect Logs
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Collaborative Dispute Resolution Context Bar */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-stone-700">
            <strong>Dispute-Proof Governance:</strong> Both FRC and Analyst views reference the same synchronized audit log. Replaces conflicting Excel sheets with an immutable, single source of truth.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-stone-500">
            {auditLogs.length} events logged
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPLANATORY DISPUTE MODAL */}
      {/* ========================================================================= */}
      {selectedDisputeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">
                  {selectedDisputeModal === 'rerun'
                    ? 'How Analytics Reruns Settle Project Disputes'
                    : 'How Requirement Re-Finalizations Settle Disputes'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDisputeModal(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-3 leading-relaxed">
              {selectedDisputeModal === 'rerun' ? (
                <>
                  <p>
                    <strong>The Common Dispute:</strong> In traditional Excel-driven waterfall scoping, project managers or FRC owners frequently dispute analyst deadlines: <em>"Why did Step 2 take 6 days when the schedule said 3 days?"</em>
                  </p>
                  <p>
                    <strong>The Solution in this App:</strong> The <strong>Analytics Reruns Counter</strong> provides timestamped, immutable proof of every occasion an analytical script was re-run. When FRC changes an exclusion rule or discovers boundary edge cases, each re-run is automatically registered with rationale and runtime metrics.
                  </p>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 font-medium">
                    ✓ Total transparency: Proves analytical delays were necessary response iterations rather than analyst inactivity.
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>The Common Dispute:</strong> Analysts often bear the blame for schedule slips when requirements keep changing under their feet: <em>"We agreed on the scope last week, why are the population numbers still shifting?"</em>
                  </p>
                  <p>
                    <strong>The Solution in this App:</strong> The <strong>Requirement Re-Finalizations Counter</strong> tracks every time FRC unlocks, modifies, and re-finalizes a step after baseline. It generates version diffs (v1, v2, v3...) and alerts all stakeholders simultaneously.
                  </p>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 font-medium">
                    ✓ Audit-grade accountability: Quantifies scope churn and protects both FRC and Analyst teams during Steering Committee reviews.
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDisputeModal(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
