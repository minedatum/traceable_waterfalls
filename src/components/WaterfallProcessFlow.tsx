import React from 'react';
import {
  Database,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Workflow,
  Plus,
  GitBranch,
} from 'lucide-react';
import { WaterfallEntity, ProjectEntity, DataSourceType } from '../types';

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
  const waterfalls = project.waterfalls || [];

  // Helper to extract population numbers from waterfall rows
  const getWfPopulationStats = (wf: WaterfallEntity) => {
    const rows = wf.rows || [];
    const stepCount = rows.length;
    const initialPop =
      rows.length > 0 && typeof rows[0].startingPopulation === 'number'
        ? rows[0].startingPopulation
        : typeof rows[0]?.includeCaseCount === 'number'
        ? rows[0].includeCaseCount
        : null;

    const finalPop =
      rows.length > 0 && typeof rows[rows.length - 1].finalPopulation === 'number'
        ? rows[rows.length - 1].finalPopulation
        : rows.length > 0 && typeof rows[rows.length - 1].includeCaseCount === 'number'
        ? rows[rows.length - 1].includeCaseCount
        : null;

    const finalizedSteps = rows.filter(
      (r) => r.status === 'step_finalized' || r.status === 'signed_off'
    ).length;

    return { stepCount, initialPop, finalPop, finalizedSteps, rows };
  };

  return (
    <div className="w-full space-y-3">
      {/* Model View Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/90 px-4 py-2.5 rounded-xl border border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-stone-900 flex items-center gap-2">
              <span>Model View: Population Lineage & Process Flow</span>
              <span className="text-[10px] font-normal text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Power BI &amp; SAS Style
              </span>
            </h5>
            <p className="text-[11px] text-stone-500">
              Click any waterfall card directly to open its analytical workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Subtle Legend */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-stone-600 bg-white px-3 py-1 rounded-lg border border-stone-200 shadow-2xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
              Cascading Lineage
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              Shared Data Source
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Independent Origin
            </span>
          </div>

          {canEdit && onAddWaterfall && (
            <button
              type="button"
              onClick={onAddWaterfall}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Add an additional waterfall to this project flow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Waterfall</span>
            </button>
          )}
        </div>
      </div>

      {/* Model Canvas Container */}
      <div className="relative bg-gradient-to-b from-stone-50/50 to-white rounded-2xl border border-stone-200 p-6 overflow-x-auto min-h-[360px]">
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
            <p className="text-xs text-stone-500 font-medium">
              No waterfalls configured yet in this project.
            </p>
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
          <div className="relative z-10 flex flex-col min-w-[640px]">
            {waterfalls.map((wf, wfIndex) => {
              const stats = getWfPopulationStats(wf);
              const isFirst = wfIndex === 0;

              // Lineage details
              const lineage = wf.lineage;
              const isCascading = lineage?.type === 'cascading' || (!lineage && !isFirst);
              const isSharedSource = lineage?.type === 'shared_source';

              // Determine upstream parent waterfall if cascading
              const parentWf = isCascading
                ? waterfalls.find((w) => w.id === lineage?.parentWaterfallId) || waterfalls[wfIndex - 1]
                : undefined;

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
                  ? 'Enterprise Database / EDW Table'
                  : 'Flat File provided by stakeholder');

              return (
                <React.Fragment key={wf.id}>
                  {/* Clean SVG Connecting Arrow (consistent dashed look & feel with first arrow) */}
                  {!isFirst && isCascading && (
                    <div className="relative h-14 w-full flex items-center my-0.5">
                      <div className="absolute left-[540px] top-0 h-14 w-28 pointer-events-none">
                        <svg
                          className="w-full h-full overflow-visible"
                          viewBox="0 0 112 56"
                          fill="none"
                        >
                          <defs>
                            <marker
                              id={`cascade-arrowhead-${wf.id}`}
                              markerWidth="8"
                              markerHeight="8"
                              refX="6"
                              refY="4"
                              orient="auto"
                            >
                              <polygon points="0 1, 7 4, 0 7" fill="#94a3b8" />
                            </marker>
                          </defs>
                          {/* Curved bezier connector matching the dashed stroke, color, and arrowhead of the first arrow */}
                          <path
                            d="M 12 0 C 48 14, 48 40, 12 52"
                            stroke="#94a3b8"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            fill="none"
                            markerEnd={`url(#cascade-arrowhead-${wf.id})`}
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  {!isFirst && !isCascading && (
                    /* Minimal subtle gap between independent waterfalls */
                    <div className="h-6 w-full" />
                  )}

                  {/* Waterfall Process Node Row (Square-shaped cards taking lesser space) */}
                  <div className="flex items-center gap-3">
                    {!isCascading ? (
                      <>
                        {/* 1. DATA SOURCE PROVENANCE CARD (Square Shape, w-60 h-52) - Rendered only for initial or independent waterfalls */}
                        <div className="w-60 h-52 shrink-0 bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                                DATA SOURCE PROVENANCE
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

                            <div className="pt-0.5">
                              <h6
                                className="text-xs font-bold text-stone-900 leading-snug line-clamp-2"
                                title={effectiveDataSourceDetail}
                              >
                                {effectiveDataSourceDetail}
                              </h6>
                              <p className="text-[10px] text-stone-500 mt-1 line-clamp-2">
                                {effectiveDataSourceType === 'Database'
                                  ? 'Direct SQL / EDW Extraction query'
                                  : 'Flat File provided by stakeholder'}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-100 text-[10px] text-stone-500 flex items-center justify-between">
                            <span>Lineage Role:</span>
                            <strong className="text-stone-800 font-semibold truncate max-w-[130px]">
                              {isFirst
                                ? 'Root Intake (WF #1)'
                                : isSharedSource
                                ? 'Shared Origin'
                                : 'Independent Feed'}
                            </strong>
                          </div>
                        </div>

                        {/* 2. DOTTED INGEST CONNECTOR */}
                        <div className="w-12 h-52 shrink-0 flex flex-col items-center justify-center text-stone-400">
                          <svg className="w-8 h-6" viewBox="0 0 32 24" fill="none">
                            <path
                              d="M 4 12 L 24 12"
                              stroke="#94a3b8"
                              strokeWidth="2"
                              strokeDasharray="3 3"
                            />
                            <polygon points="22,8 28,12 22,16" fill="#94a3b8" />
                          </svg>
                          <span className="text-[9px] font-mono text-stone-400 -mt-0.5">ingest</span>
                        </div>
                      </>
                    ) : (
                      /* Cascading Waterfall: Emerges directly from upstream waterfall output via curved arrow.
                         No redundant Data Source card or ingest connector is rendered. Spacer aligns card directly under parent. */
                      <div className="w-[300px] h-52 shrink-0 hidden sm:block pointer-events-none" aria-hidden="true" />
                    )}

                    {/* 3. WATERFALL PROCESS ENTITY CARD (Square Shape, w-80 h-52, Clickable with NO Open button) */}
                    <div
                      onClick={() => onOpenWaterfall(wf.id)}
                      className="w-80 h-52 shrink-0 bg-white rounded-2xl border border-stone-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer p-4 shadow-2xs flex flex-col justify-between group relative"
                      title={`Click to open ${wf.name}`}
                    >
                      {/* Top: WF Badge, Title, ID */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                            WF #{wfIndex + 1}
                          </span>
                          <h4
                            className="text-xs font-bold text-stone-900 group-hover:text-purple-700 transition-colors line-clamp-1"
                            title={wf.name}
                          >
                            {wf.name}
                          </h4>
                        </div>
                        <div className="text-[10px] text-stone-400 pl-8 flex items-center justify-between">
                          <span>
                            ID: {wf.id}
                          </span>
                          {isCascading && parentWf && (
                            <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded shrink-0" title={`Starting population inherits from ${parentWf.name}`}>
                              Emerging from WF #{waterfalls.findIndex((w) => w.id === parentWf.id) + 1}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Metrics (Final Population & Scope Progress) */}
                      <div className="py-2.5 px-3 bg-stone-50/80 rounded-xl border border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-stone-400 block uppercase tracking-wider font-semibold">
                            Final Population
                          </span>
                          <span className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                            {stats.finalPop !== null ? stats.finalPop.toLocaleString() : 'Pending'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-stone-400 block uppercase tracking-wider font-semibold">
                            Scope Progress
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-700 block">
                            {stats.finalizedSteps}/{stats.stepCount} Steps Finalized
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Step status summary and hover hint */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500 font-medium">
                          {stats.rows.length === 0
                            ? 'No scoping steps yet'
                            : `${stats.rows.length} ${stats.rows.length === 1 ? 'rule step' : 'rule steps'}`}
                        </span>

                        <span className="text-purple-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
                          <span>Enter</span>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                        </span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
