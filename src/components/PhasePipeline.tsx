import React from 'react';
import {
  FileText,
  Layers,
  Code2,
  CheckCircle,
  Rocket,
  ShieldCheck,
  AlertCircle,
  Check,
} from 'lucide-react';
import { PhaseAuditSummary, PhaseId } from '../types';

interface PhasePipelineProps {
  phases: PhaseAuditSummary[];
  selectedPhase: PhaseId | 'all';
  onSelectPhase: (phase: PhaseId | 'all') => void;
}

const PHASE_ICONS: Record<string, React.ElementType> = {
  requirements: FileText,
  design: Layers,
  implementation: Code2,
  testing: CheckCircle,
  deployment: Rocket,
  maintenance: ShieldCheck,
};

export const PhasePipeline: React.FC<PhasePipelineProps> = ({
  phases,
  selectedPhase,
  onSelectPhase,
}) => {
  return (
    <section id="phase-pipeline-section" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-stone-900 tracking-tight flex items-center gap-2">
          <span>Waterfall Phase Gates</span>
          <span className="text-xs font-normal text-stone-500">
            (Strict sequential gate clearance)
          </span>
        </h2>
        {selectedPhase !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectPhase('all')}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 underline"
          >
            Show All Phases
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {phases.map((phase) => {
          const isSelected = selectedPhase === phase.phaseId;
          const Icon = PHASE_ICONS[phase.phaseId] || FileText;
          const isPassed = phase.gatePassed;
          const isWarning = isPassed && (phase.outdatedCount > 0 || phase.missingCount > 0);

          return (
            <button
              key={phase.phaseId}
              type="button"
              id={`phase-step-${phase.phaseId}`}
              onClick={() => onSelectPhase(isSelected ? 'all' : phase.phaseId)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-stone-900 ring-offset-1'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-stone-800 text-emerald-400'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Status chip */}
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? isPassed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                        : isPassed
                        ? isWarning
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isPassed ? (
                      isWarning ? (
                        'Warning'
                      ) : (
                        <>
                          <Check className="w-2.5 h-2.5 mr-0.5" /> Pass
                        </>
                      )
                    ) : (
                      <>
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Blocked
                      </>
                    )}
                  </span>
                </div>

                <div className="text-xs font-semibold truncate">
                  {phase.phaseName}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className={isSelected ? 'text-stone-300' : 'text-stone-500'}>
                    Deliverables
                  </span>
                  <span className={`font-medium ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                    {phase.presentCount}/{phase.totalRequired}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className={`w-full h-1 rounded-full overflow-hidden ${
                    isSelected ? 'bg-stone-800' : 'bg-stone-100'
                  }`}
                >
                  <div
                    className={`h-full ${
                      isPassed
                        ? isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${
                        phase.totalRequired > 0
                          ? (phase.presentCount / phase.totalRequired) * 100
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
