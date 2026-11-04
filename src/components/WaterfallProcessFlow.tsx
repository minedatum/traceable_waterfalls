import React, { useState } from 'react';
import {
  Database,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  GitBranch,
  Workflow,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Plus,
  Info,
  Calendar,
  Share2,
} from 'lucide-react';
import { WaterfallEntity, ProjectEntity, DataSourceType, LineageType } from '../types';

interface WaterfallProcessFlowProps {
  project: ProjectEntity;
  onOpenWaterfall: (waterfallId: string) => void;
  onAddWaterfall?: () => void;
  canEdit?: boolean;
}

export const WaterfallProcessFlow: React.FC<WaterfallProcessFlowProps> = ({
  project,
  onOpenWaterfall,
  onAddWaterfall,
  canEdit = true,
}) => {
  const [selectedWfId, setSelectedWfId] = useState<string | null>(null);

  const waterfalls = project.waterfalls || [];

  // Helper to extract population numbers from waterfall rows
  const getWfPopulationStats = (wf: WaterfallEntity) => {
    const rows = wf.rows || [];
    const stepCount = rows.length;
    const initialPop = rows.length > 0 && typeof rows[0].startingPopulation === 'number'
      ? rows[0].startingPopulation
      : (typeof rows[0]?.finalPopulation === 'number' ? rows[0].finalPopulation : null);
    
    const finalPop = rows.length > 0 && typeof rows[rows.length - 1].finalPopulation === 'number'
      ? rows[rows.length - 1].finalPopulation
      : null;

    const finalizedSteps = rows.filter(
      (r) => r.status === 'step_finalized' || r.status === 'signed_off'
    ).length;

    return { stepCount, initialPop, finalPop, finalizedSteps, rows };
  };

  // Group waterfalls by their lineage relationships
  // WF #1 (or root) typically starts from the project's data source
  const rootWaterfalls = waterfalls.filter((wf, index) => {
    if (index === 0) return true;
    return !wf.lineage || wf.lineage.type === 'independent';
  });

  return (
    <div className="w-full space-y-4">
      {/* Model View Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/90 p-3 rounded-xl border border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-stone-900 flex items-center gap-2">
              <span>Model View: Population Lineage & Process Flow</span>
              <span className="text-[10px] font-normal text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Power BI & SAS Style
              </span>
            </h5>
            <p className="text-[11px] text-stone-500">
              Interactive process lineage diagram demonstrating population flow, terminal connectors, and data sources.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-stone-600 bg-white px-3 py-1 rounded-lg border border-stone-200 shadow-2xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
              Cascading Flow
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              Shared Data Source
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Independent Cohort
            </span>
          </div>

          {canEdit && onAddWaterfall && (
            <button
              type="button"
              onClick={onAddWaterfall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Add a linked waterfall to this project flow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Linked Waterfall</span>
            </button>
          )}
        </div>
      </div>

      {/* Model Canvas Container */}
      <div className="relative bg-gradient-to-b from-stone-50/60 to-white rounded-2xl border border-stone-200 p-5 overflow-x-auto min-h-[380px]">
        {/* Subtle grid background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {waterfalls.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Workflow className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-500 font-medium">No waterfalls configured yet in this project.</p>
            {canEdit && onAddWaterfall && (
              <button
                type="button"
                onClick={onAddWaterfall}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
              >
                + Add Initial Waterfall
              </button>
            )}
          </div>
        ) : (
          <div className="relative z-10 flex flex-col gap-8 min-w-[720px]">
            {/* Visual Flow Pipeline */}
            {waterfalls.map((wf, wfIndex) => {
              const stats = getWfPopulationStats(wf);
              const isSelected = selectedWfId === wf.id;
              const isFirst = wfIndex === 0;

              // Lineage details
              const lineage = wf.lineage;
              const isCascading = lineage?.type === 'cascading';
              const isSharedSource = lineage?.type === 'shared_source';
              const isIndependent = !lineage || lineage.type === 'independent';

              // Determine upstream parent waterfall if cascading
              const parentWf = isCascading
                ? waterfalls.find((w) => w.id === lineage?.parentWaterfallId) || waterfalls[wfIndex - 1]
                : undefined;
              const parentStats = parentWf ? getWfPopulationStats(parentWf) : null;

              // Data Source display
              const effectiveDataSourceType: DataSourceType =
                wf.dataSourceType ||
                (isSharedSource && parentWf?.dataSourceType) ||
                project.projectDetails.initialDataSourceType ||
                'Database';

              const effectiveDataSourceDetail =
                wf.dataSourceDetail ||
                (isSharedSource && parentWf?.dataSourceDetail) ||
                project.projectDetails.initialDataSourceDetail ||
                (effectiveDataSourceType === 'Database'
                  ? 'Enterprise Database / Data Warehouse'
                  : 'Flat File provided by stakeholder');

              return (
                <div key={wf.id} className="relative">
                  {/* SAS Process Connector Stream (Rendered above secondary waterfalls) */}
                  {!isFirst && (
                    <div className="mb-4 pl-8 flex items-center gap-3">
                      {isCascading ? (
                        <div className="flex-1 flex items-center gap-3 bg-purple-50/80 border border-purple-200/90 rounded-xl px-4 py-2 shadow-2xs">
                          {/* Curved SVG Connector Indicator */}
                          <div className="flex items-center text-purple-600 shrink-0">
                            <svg className="w-6 h-6 overflow-visible" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M4 2 C 4 14, 20 10, 20 22"
                                stroke="#9333ea"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                fill="none"
                              />
                              <polygon points="17,19 20,24 23,19" fill="#9333ea" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-purple-900">
                                Cascading Population Connection (SAS Process Flow)
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                Terminal Step &rarr; Starting Population
                              </span>
                            </div>
                            <p className="text-[11px] text-purple-700 truncate mt-0.5">
                              Ingests terminal output from{' '}
                              <strong>{parentWf?.name || `Waterfall #${wfIndex}`}</strong>
                              {parentStats?.finalPop !== null && (
                                <span className="ml-1.5 font-mono font-bold text-purple-900 bg-white/80 px-1.5 py-0.5 rounded border border-purple-200">
                                  {parentStats?.finalPop?.toLocaleString()} records
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ) : isSharedSource ? (
                        <div className="flex-1 flex items-center gap-3 bg-blue-50/80 border border-blue-200/90 rounded-xl px-4 py-2 shadow-2xs">
                          <GitBranch className="w-5 h-5 text-blue-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-900">
                                Shared Data Source Branch
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Common Origin: {effectiveDataSourceType}
                              </span>
                            </div>
                            <p className="text-[11px] text-blue-700 truncate mt-0.5">
                              Originates from same baseline extract as{' '}
                              <strong>{parentWf?.name || 'Waterfall #1'}</strong> ({effectiveDataSourceDetail})
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center gap-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-4 py-2 shadow-2xs">
                          <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-900">
                                Independent Population Flow
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                Standalone Origin
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 truncate mt-0.5">
                              Processes a separate stakeholder cohort independent of previous waterfalls.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Waterfall Node Row */}
                  <div className="grid grid-cols-12 gap-4 items-stretch">
                    {/* Provenance Data Source Card (Col 1-3) */}
                    <div className="col-span-12 md:col-span-3 bg-white rounded-xl border border-stone-200 p-3.5 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                            Data Source Provenance
                          </span>
                          {effectiveDataSourceType === 'Database' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <Database className="w-3 h-3 text-blue-600" />
                              DataBase
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <FileSpreadsheet className="w-3 h-3 text-amber-600" />
                              Flat File
                            </span>
                          )}
                        </div>

                        <div className="pt-1">
                          <h6 className="text-xs font-bold text-stone-900 truncate">
                            {effectiveDataSourceDetail}
                          </h6>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            {effectiveDataSourceType === 'Database'
                              ? 'Direct SQL / EDW Extraction query'
                              : 'Flat File provided by stakeholder'}
                          </p>
                        </div>
                      </div>

                      {/* Lineage Origin badge */}
                      <div className="mt-3 pt-2.5 border-t border-stone-100 text-[10px] text-stone-500 flex items-center justify-between">
                        <span>Lineage Role:</span>
                        <strong className="text-stone-800 font-medium">
                          {isFirst
                            ? 'Root Intake (WF #1)'
                            : isCascading
                            ? 'Cascaded Cohort'
                            : isSharedSource
                            ? 'Forked Extract'
                            : 'Independent Feed'}
                        </strong>
                      </div>
                    </div>

                    {/* Connecting Arrow between Data Source and Waterfall (MD+ screens) */}
                    <div className="hidden md:flex col-span-1 items-center justify-center">
                      <div className="flex flex-col items-center text-stone-400">
                        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                          <path
                            d="M 4 16 L 24 16"
                            stroke="#94a3b8"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                          <polygon points="22,12 28,16 22,20" fill="#94a3b8" />
                        </svg>
                        <span className="text-[9px] font-mono text-stone-400 -mt-1">ingest</span>
                      </div>
                    </div>

                    {/* Waterfall Process Entity Card (Col 4-12) */}
                    <div
                      onClick={() => setSelectedWfId(selectedWfId === wf.id ? null : wf.id)}
                      className={`col-span-12 md:col-span-8 bg-white rounded-xl border transition-all cursor-pointer p-4 shadow-2xs hover:shadow-xs ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-100'
                          : 'border-stone-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                            WF #{wfIndex + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-stone-900 truncate">
                              {wf.name}
                            </h4>
                            <span className="text-[10px] text-stone-400">
                              ID: {wf.id} • Created {wf.createdAt ? new Date(wf.createdAt).toLocaleDateString() : 'Active'}
                            </span>
                          </div>
                        </div>

                        {/* Metric Highlights */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block uppercase tracking-wide">
                              Final Population
                            </span>
                            <span className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                              {stats.finalPop !== null ? stats.finalPop.toLocaleString() : 'Pending'}
                            </span>
                          </div>

                          <div className="text-right pl-3 border-l border-stone-100">
                            <span className="text-[10px] text-stone-400 block uppercase tracking-wide">
                              Scope Progress
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-700">
                              {stats.finalizedSteps}/{stats.stepCount} Steps Finalized
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenWaterfall(wf.id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title={`Open ${wf.name} in analytical workspace`}
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
                          </button>
                        </div>
                      </div>

                      {/* Mini Step Pipeline Timeline */}
                      <div className="mt-3 pt-1">
                        {stats.rows.length === 0 ? (
                          <p className="text-[11px] text-stone-400 italic">
                            No scoping steps defined yet in this waterfall.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                              <span className="font-medium">Milestone Step Lineage Breakdown:</span>
                              <span className="font-mono text-[10px] text-stone-400">
                                {stats.rows.length} total transformation rules
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {stats.rows.slice(0, 4).map((row, rIdx) => {
                                const isFinalStep = rIdx === stats.rows.length - 1;
                                return (
                                  <div
                                    key={row.id || rIdx}
                                    className={`p-2 rounded-lg border text-left text-[11px] ${
                                      isFinalStep
                                        ? 'bg-purple-50/70 border-purple-200'
                                        : 'bg-stone-50/60 border-stone-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <span className="font-mono font-bold text-stone-700 text-[10px]">
                                        Step {row.stepNumber || rIdx + 1}
                                      </span>
                                      {isFinalStep && (
                                        <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1 py-0.2 rounded">
                                          Output
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-medium text-stone-900 truncate" title={row.stepTitle}>
                                      {row.stepTitle || 'Untitled Step'}
                                    </div>
                                    <div className="text-[10px] font-mono text-stone-500 mt-1 flex items-center justify-between">
                                      <span>Pop:</span>
                                      <strong className="text-stone-800 tabular-nums">
                                        {typeof row.finalPopulation === 'number'
                                          ? row.finalPopulation.toLocaleString()
                                          : '—'}
                                      </strong>
                                    </div>
                                  </div>
                                );
                              })}
                              {stats.rows.length > 4 && (
                                <div className="p-2 rounded-lg border border-dashed border-stone-200 bg-stone-50/30 flex items-center justify-center text-[11px] text-stone-500 font-medium">
                                  +{stats.rows.length - 4} more steps...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
