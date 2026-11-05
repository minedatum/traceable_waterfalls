import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Workflow,
  Plus,
  GitBranch,
  RotateCcw,
  GripHorizontal,
  Move,
} from 'lucide-react';
import { WaterfallEntity, ProjectEntity, DataSourceType } from '../types';

interface WaterfallProcessFlowProps {
  project: ProjectEntity;
  onOpenWaterfall: (waterfallId: string) => void;
  onAddWaterfall?: () => void;
  canEdit?: boolean;
}

type Position = { x: number; y: number };

export const WaterfallProcessFlow: React.FC<WaterfallProcessFlowProps> = ({
  project,
  onOpenWaterfall,
  onAddWaterfall,
  canEdit = true,
}) => {
  const waterfalls = project.waterfalls || [];
  const storageKey = `traceable_wf_canvas_pos_${project.id}`;

  // Default layout generator: Data Source at left, Waterfalls stacked or sequenced
  const computeDefaultPositions = (): Record<string, Position> => {
    const initial: Record<string, Position> = {};
    let currentY = 32;

    waterfalls.forEach((wf, idx) => {
      const isFirst = idx === 0;
      const isCascading = wf.lineage?.type === 'cascading' || (!wf.lineage && !isFirst);

      if (!isCascading) {
        // Non-cascading waterfall has its dedicated source card
        initial[`source-${wf.id}`] = { x: 32, y: currentY };
        initial[`wf-${wf.id}`] = { x: 330, y: currentY };
        currentY += 270;
      } else {
        // Cascading waterfall emerges from upstream, positioned directly in waterfall column
        initial[`wf-${wf.id}`] = { x: 330, y: currentY };
        currentY += 270;
      }
    });

    return initial;
  };

  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = computeDefaultPositions();
        return { ...defaults, ...parsed };
      }
    } catch {
      // ignore
    }
    return computeDefaultPositions();
  });

  // Keep positions synchronized if new waterfalls are added to project
  useEffect(() => {
    setPositions((prev) => {
      const defaults = computeDefaultPositions();
      let hasMissing = false;
      const updated = { ...prev };
      Object.keys(defaults).forEach((key) => {
        if (!updated[key]) {
          updated[key] = defaults[key];
          hasMissing = true;
        }
      });
      return hasMissing ? updated : prev;
    });
  }, [waterfalls.length, project.id]);

  // Drag tracking state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  } | null>(null);

  const handlePointerDown = (nodeId: string, e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;

    const currentPos = positions[nodeId] || { x: 32, y: 32 };
    dragRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      origX: currentPos.x,
      origY: currentPos.y,
      hasMoved: false,
    };
    setDraggingNodeId(nodeId);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.hasMoved = true;
    }

    const newX = Math.max(16, dragRef.current.origX + dx);
    const newY = Math.max(16, dragRef.current.origY + dy);

    setPositions((prev) => ({
      ...prev,
      [dragRef.current!.nodeId]: { x: newX, y: newY },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent, onNodeClick?: () => void) => {
    if (dragRef.current) {
      if (!dragRef.current.hasMoved && onNodeClick) {
        onNodeClick();
      } else if (dragRef.current.hasMoved) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(positions));
        } catch {
          // ignore
        }
      }
    }
    dragRef.current = null;
    setDraggingNodeId(null);
  };

  const handleResetLayout = () => {
    const defaults = computeDefaultPositions();
    setPositions(defaults);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

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

  // Calculate dynamic canvas bounds based on draggable card locations
  const posValues: Position[] = Object.values(positions);
  const canvasWidth = Math.max(860, ...posValues.map((p) => p.x + 360));
  const canvasHeight = Math.max(620, ...posValues.map((p) => p.y + 260));

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
              Drag cards anywhere to customize placement. Arrows dynamically re-route in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset Layout Button */}
          <button
            type="button"
            onClick={handleResetLayout}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium rounded-lg border border-stone-200 shadow-2xs transition-colors cursor-pointer"
            title="Reset cards to default grid layout"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset Layout</span>
          </button>

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
      <div className="relative bg-gradient-to-b from-stone-50/50 to-white rounded-2xl border border-stone-200 p-4 overflow-auto min-h-[480px]">
        {/* Subtle grid background pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
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
          <div
            className="relative"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              minHeight: '480px',
            }}
          >
            {/* SVG Dynamic Connectors Layer */}
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0"
              style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
            >
              <defs>
                <marker
                  id="canvas-flow-arrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 7 4, 0 7" fill="#94a3b8" />
                </marker>
              </defs>

              {waterfalls.map((wf, wfIndex) => {
                const isFirst = wfIndex === 0;
                const lineage = wf.lineage;
                const isCascading = lineage?.type === 'cascading' || (!lineage && !isFirst);

                const wfPos = positions[`wf-${wf.id}`] || { x: 330, y: 32 + wfIndex * 270 };
                const wfWidth = 320;
                const wfHeight = 208;

                // 1. Ingest Arrow (only for initial or independent waterfalls with dedicated source card)
                if (!isCascading) {
                  const sourcePos = positions[`source-${wf.id}`] || { x: 32, y: wfPos.y };
                  const sourceWidth = 240;
                  const sourceHeight = 208;

                  let sx: number;
                  let sy: number;
                  let tx: number;
                  let ty: number;

                  if (wfPos.x >= sourcePos.x + sourceWidth) {
                    // Waterfall is to the right of source
                    sx = sourcePos.x + sourceWidth;
                    sy = sourcePos.y + sourceHeight / 2;
                    tx = wfPos.x;
                    ty = wfPos.y + wfHeight / 2;
                  } else {
                    // Waterfall is to the left or underneath
                    sx = sourcePos.x;
                    sy = sourcePos.y + sourceHeight / 2;
                    tx = wfPos.x + wfWidth;
                    ty = wfPos.y + wfHeight / 2;
                  }

                  const dx = tx - sx;
                  const cx1 = sx + dx * 0.45;
                  const cx2 = tx - dx * 0.45;
                  const pathData = `M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ty}, ${tx} ${ty}`;
                  const midX = (sx + tx) / 2;
                  const midY = (sy + ty) / 2;

                  return (
                    <g key={`arrow-source-${wf.id}`}>
                      <path
                        d={pathData}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        fill="none"
                        markerEnd="url(#canvas-flow-arrowhead)"
                      />
                      {Math.abs(dx) > 60 && (
                        <text
                          x={midX}
                          y={midY - 6}
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          ingest
                        </text>
                      )}
                    </g>
                  );
                }

                // 2. Cascading Population Arrow (Parent Output -> Child Waterfall)
                if (isCascading) {
                  const parentWf =
                    waterfalls.find((w) => w.id === lineage?.parentWaterfallId) ||
                    waterfalls[wfIndex - 1];
                  if (!parentWf) return null;

                  const parentPos = positions[`wf-${parentWf.id}`] || {
                    x: 330,
                    y: 32 + (wfIndex - 1) * 270,
                  };
                  const parentWidth = 320;
                  const parentHeight = 208;

                  let px: number;
                  let py: number;
                  let cx: number;
                  let cy: number;
                  let pathData: string;

                  // Adaptive connector routing based on relative placement
                  if (wfPos.y >= parentPos.y + parentHeight - 30) {
                    // Child is positioned below parent (standard flow)
                    // Originates from Final Population area of parent bottom edge
                    px = parentPos.x + 220;
                    py = parentPos.y + parentHeight;
                    cx = wfPos.x + 220;
                    cy = wfPos.y;

                    const dy = cy - py;
                    const curveOffset = Math.max(28, (cx >= px ? 36 : -36));
                    const c1x = px + curveOffset;
                    const c1y = py + Math.max(14, dy * 0.4);
                    const c2x = cx + curveOffset;
                    const c2y = cy - Math.max(14, dy * 0.4);

                    pathData = `M ${px} ${py} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${cx} ${cy}`;
                  } else if (wfPos.x >= parentPos.x + parentWidth - 20) {
                    // Child is positioned to the right of parent
                    px = parentPos.x + parentWidth;
                    py = parentPos.y + parentHeight / 2;
                    cx = wfPos.x;
                    cy = wfPos.y + wfHeight / 2;

                    const dx = cx - px;
                    const c1x = px + Math.max(24, dx * 0.45);
                    const c2x = cx - Math.max(24, dx * 0.45);

                    pathData = `M ${px} ${py} C ${c1x} ${py}, ${c2x} ${cy}, ${cx} ${cy}`;
                  } else {
                    // Default fallback adaptive curve
                    px = parentPos.x + parentWidth / 2;
                    py = parentPos.y + parentHeight;
                    cx = wfPos.x + wfWidth / 2;
                    cy = wfPos.y;

                    const dy = cy - py;
                    pathData = `M ${px} ${py} C ${px} ${py + dy * 0.5}, ${cx} ${cy - dy * 0.5}, ${cx} ${cy}`;
                  }

                  return (
                    <g key={`arrow-cascade-${wf.id}`}>
                      <path
                        d={pathData}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        fill="none"
                        markerEnd="url(#canvas-flow-arrowhead)"
                      />
                    </g>
                  );
                }

                return null;
              })}
            </svg>

            {/* Draggable Node Cards Layer */}
            {waterfalls.map((wf, wfIndex) => {
              const stats = getWfPopulationStats(wf);
              const isFirst = wfIndex === 0;

              const lineage = wf.lineage;
              const isCascading = lineage?.type === 'cascading' || (!lineage && !isFirst);
              const isSharedSource = lineage?.type === 'shared_source';

              const parentWf = isCascading
                ? waterfalls.find((w) => w.id === lineage?.parentWaterfallId) || waterfalls[wfIndex - 1]
                : undefined;

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

              const sourceNodeId = `source-${wf.id}`;
              const wfNodeId = `wf-${wf.id}`;

              const sourcePos = positions[sourceNodeId] || { x: 32, y: 32 + wfIndex * 270 };
              const wfPos = positions[wfNodeId] || { x: 330, y: 32 + wfIndex * 270 };

              const isDraggingSource = draggingNodeId === sourceNodeId;
              const isDraggingWf = draggingNodeId === wfNodeId;

              return (
                <React.Fragment key={wf.id}>
                  {/* 1. DATA SOURCE PROVENANCE CARD (Draggable, rendered only for initial/independent waterfalls) */}
                  {!isCascading && (
                    <div
                      onPointerDown={(e) => handlePointerDown(sourceNodeId, e)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={(e) => handlePointerUp(e)}
                      style={{
                        position: 'absolute',
                        left: `${sourcePos.x}px`,
                        top: `${sourcePos.y}px`,
                      }}
                      className={`w-60 h-52 bg-white rounded-2xl border p-4 flex flex-col justify-between cursor-grab select-none z-10 transition-shadow ${
                        isDraggingSource
                          ? 'cursor-grabbing shadow-xl ring-2 ring-indigo-400 z-30 scale-[1.01]'
                          : 'border-stone-200 hover:border-indigo-300 hover:shadow-md shadow-2xs'
                      }`}
                    >
                      {/* Top Drag Grip Handle & Label */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-stone-400 pb-0.5">
                          <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold">
                            <GripHorizontal className="w-3.5 h-3.5 text-stone-400" />
                            DATA SOURCE
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
                  )}

                  {/* 2. WATERFALL PROCESS ENTITY CARD (Draggable, Clickable to open) */}
                  <div
                    onPointerDown={(e) => handlePointerDown(wfNodeId, e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(e) => handlePointerUp(e, () => onOpenWaterfall(wf.id))}
                    style={{
                      position: 'absolute',
                      left: `${wfPos.x}px`,
                      top: `${wfPos.y}px`,
                    }}
                    className={`w-80 h-52 bg-white rounded-2xl border p-4 flex flex-col justify-between cursor-grab select-none z-10 transition-shadow group ${
                      isDraggingWf
                        ? 'cursor-grabbing shadow-xl ring-2 ring-purple-400 z-30 scale-[1.01]'
                        : 'border-stone-200 hover:border-purple-300 hover:shadow-md shadow-2xs'
                    }`}
                    title="Drag to reposition • Click to open waterfall workspace"
                  >
                    {/* Top Grip & Header */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-stone-400 pb-0.5">
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold text-stone-400 group-hover:text-purple-600 transition-colors">
                          <GripHorizontal className="w-3.5 h-3.5 text-stone-400 group-hover:text-purple-500" />
                          WATERFALL NODE
                        </span>
                        {isCascading && parentWf && (
                          <span
                            className="text-[9px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded shrink-0"
                            title={`Starting population emerges from ${parentWf.name}`}
                          >
                            Emerging from WF #{waterfalls.findIndex((w) => w.id === parentWf.id) + 1}
                          </span>
                        )}
                      </div>

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

                      <div className="text-[10px] text-stone-400 pl-8">
                        ID: {wf.id} • Created{' '}
                        {wf.createdAt ? new Date(wf.createdAt).toLocaleDateString() : 'Active'}
                      </div>
                    </div>

                    {/* Middle: Metrics (Final Population & Scope Progress) */}
                    <div className="py-2.5 px-3 bg-stone-50/80 rounded-xl border border-stone-100 flex items-center justify-between pointer-events-none">
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

                    {/* Bottom: Step count and Enter action hint */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500 font-medium">
                        {stats.rows.length === 0
                          ? 'No scoping steps yet'
                          : `${stats.rows.length} ${stats.rows.length === 1 ? 'rule step' : 'rule steps'}`}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWaterfall(wf.id);
                        }}
                        className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px] cursor-pointer"
                        title={`Open ${wf.name}`}
                      >
                        <span>Enter</span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                      </button>
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
