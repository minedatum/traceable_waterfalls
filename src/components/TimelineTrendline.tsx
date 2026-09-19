import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { WaterfallRow } from '../types';

interface TimelineTrendlineProps {
  mode: 'requirements' | 'analytics';
  rows: WaterfallRow[];
  title?: string;
  className?: string;
}

interface MilestonePoint {
  stepId: string;
  stepNumber: number;
  stepTitle: string;
  timestamp: string;
  displayDate: string;
  displayTime: string;
  rawDate: number;
  cumulativeSteps: number;
  daysFromFirst: number;
  workingDays: number;
  casesProcessed?: number;
  rerunCount: number;
  refinalizeCount: number;
  actor: string;
  status: string;
}

export const TimelineTrendline: React.FC<TimelineTrendlineProps> = ({
  mode,
  rows,
  title,
  className = '',
}) => {
  const [metricView, setMetricView] = useState<'cumulative' | 'workingDays'>('cumulative');

  // Compute milestones based on mode
  const { milestones, firstMilestone, latestMilestone, totalSpanDays, averageDaysPerStep } =
    useMemo(() => {
      const points: MilestonePoint[] = [];

      // Sort rows by step number
      const sortedRows = [...rows].sort((a, b) => a.stepNumber - b.stepNumber);

      let stepCounter = 0;

      for (const row of sortedRows) {
        let isFinalized = false;
        let finalDateStr = '';
        let actor = '';

        if (mode === 'requirements') {
          // Requirement is finalized if status is step_finalized, in_analysis, ready_for_review, signed_off
          // or has explicit requirementFinalizedAt / emailTriggeredAt
          isFinalized =
            row.status === 'step_finalized' ||
            row.status === 'in_analysis' ||
            row.status === 'ready_for_review' ||
            row.status === 'signed_off' ||
            Boolean(row.requirementFinalizedAt) ||
            Boolean(row.emailTriggeredAt);

          if (isFinalized) {
            finalDateStr =
              row.requirementFinalizedAt ||
              row.emailTriggeredAt ||
              row.lastUpdated ||
              new Date().toISOString();
            actor = row.frcOwner || 'Sarah Jenkins (FRC)';
          }
        } else {
          // Analytics is finalized if status is ready_for_review, signed_off, or analyticsCompletedAt/analyticsFirstFinalizedAt
          isFinalized =
            row.status === 'ready_for_review' ||
            row.status === 'signed_off' ||
            Boolean(row.analyticsFirstFinalizedAt) ||
            Boolean(row.analyticsCompletedAt);

          if (isFinalized) {
            finalDateStr =
              row.analyticsFirstFinalizedAt ||
              row.analyticsCompletedAt ||
              row.lastUpdated ||
              new Date().toISOString();
            actor = row.assignedAnalyst || 'Alex Morgan (Analyst)';
          }
        }

        if (isFinalized && finalDateStr) {
          stepCounter += 1;
          const dateObj = new Date(finalDateStr);
          const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

          // Estimate rerun count and refinalize count
          const frcVersions = row.versions ? row.versions.filter((v) => v.role === 'FRC Owner') : [];
          const refinalizes =
            typeof row.refinalizeCount === 'number'
              ? row.refinalizeCount
              : Math.max(0, frcVersions.length - 1);
          const reruns =
            typeof row.rerunCount === 'number'
              ? row.rerunCount
              : row.status === 'ready_for_review' || row.status === 'signed_off'
              ? 1
              : 0;

          points.push({
            stepId: row.id,
            stepNumber: row.stepNumber,
            stepTitle: row.stepTitle,
            timestamp: validDate.toISOString(),
            displayDate: validDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            displayTime: validDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            rawDate: validDate.getTime(),
            cumulativeSteps: stepCounter,
            daysFromFirst: 0, // calculated below
            workingDays: row.workingDays || 1,
            casesProcessed: row.includeCaseCount,
            rerunCount: reruns,
            refinalizeCount: refinalizes,
            actor,
            status: row.status,
          });
        }
      }

      // Sort points chronologically
      points.sort((a, b) => a.rawDate - b.rawDate);

      // Re-assign cumulative counts in chronological order and compute daysFromFirst
      if (points.length > 0) {
        const firstTime = points[0].rawDate;
        points.forEach((p, idx) => {
          p.cumulativeSteps = idx + 1;
          const diffDays = Math.max(0, Math.round((p.rawDate - firstTime) / (1000 * 60 * 60 * 24)));
          p.daysFromFirst = diffDays;
        });
      }

      const first = points.length > 0 ? points[0] : null;
      const latest = points.length > 0 ? points[points.length - 1] : null;
      const totalSpan =
        first && latest
          ? Math.max(1, Math.round((latest.rawDate - first.rawDate) / (1000 * 60 * 60 * 24)))
          : 0;

      const avgDays =
        points.length > 1
          ? (totalSpan / (points.length - 1)).toFixed(1)
          : points.length === 1
          ? points[0].workingDays.toString()
          : '0';

      return {
        milestones: points,
        firstMilestone: first,
        latestMilestone: latest,
        totalSpanDays: totalSpan,
        averageDaysPerStep: avgDays,
      };
    }, [mode, rows]);

  const isRequirements = mode === 'requirements';
  const defaultTitle = isRequirements
    ? 'Requirements Finalization Timeline Journey (FRC Governance)'
    : 'Analytics Completion Timeline Journey (Quantitative Delivery)';

  return (
    <div
      id={`timeline-trendline-${mode}`}
      className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-xs ${className}`}
    >
      {/* Header with Title & View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
              isRequirements
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">{title || defaultTitle}</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  isRequirements
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {isRequirements ? 'FRC Scoping Track' : 'Analyst Execution Track'}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {isRequirements
                ? 'Trend line from when the first WF requirement step gets finalised by FRC to the latest step.'
                : 'Trend line from when the first WF analytics step gets finalised and submitted to the latest step.'}
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricView('cumulative')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              metricView === 'cumulative'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Cumulative Velocity
          </button>
          <button
            type="button"
            onClick={() => setMetricView('workingDays')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              metricView === 'workingDays'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Calendar Days Elapsed
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span className="text-[11px] text-stone-500 font-medium block">
            {isRequirements ? 'First Requirement Finalized' : 'First Analytics Finalized'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-stone-900">
              {firstMilestone ? firstMilestone.displayDate : 'Awaiting'}
            </span>
            {firstMilestone && (
              <span className="font-mono text-[11px] text-stone-500 font-semibold">
                ({firstMilestone.stepId})
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-400 block mt-0.5">
            {firstMilestone ? firstMilestone.displayTime : 'Start of timeline'}
          </span>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span className="text-[11px] text-stone-500 font-medium block">
            {isRequirements ? 'Latest Requirement Finalized' : 'Latest Analytics Finalized'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-stone-900">
              {latestMilestone ? latestMilestone.displayDate : 'Awaiting'}
            </span>
            {latestMilestone && (
              <span className="font-mono text-[11px] text-stone-500 font-semibold">
                ({latestMilestone.stepId})
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-400 block mt-0.5">
            {latestMilestone ? `${milestones.length} steps reached` : 'Pending finalization'}
          </span>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span className="text-[11px] text-stone-500 font-medium block">Timeline Journey Span</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-stone-900">
              {milestones.length > 1 ? `${totalSpanDays} days` : milestones.length === 1 ? 'Day 1' : '0 days'}
            </span>
          </div>
          <span className="text-[10px] text-stone-400 block mt-0.5">
            {milestones.length > 1 ? `Avg ${averageDaysPerStep} days / step` : 'Milestone baseline'}
          </span>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            isRequirements
              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
              : 'bg-blue-50/70 border-blue-200 text-blue-950'
          }`}
        >
          <span
            className={`text-[11px] font-medium block ${
              isRequirements ? 'text-indigo-800' : 'text-blue-800'
            }`}
          >
            {isRequirements ? 'Requirement Re-Finalizations' : 'Analytics Reruns Incurred'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold">
              {isRequirements
                ? milestones.reduce((sum, m) => sum + m.refinalizeCount, 0)
                : milestones.reduce((sum, m) => sum + m.rerunCount, 0)}
            </span>
            <span className="text-xs font-medium opacity-80">
              {isRequirements ? 'renegotiated' : 'rerun iterations'}
            </span>
          </div>
          <span className="text-[10px] opacity-70 block mt-0.5">
            {isRequirements ? 'Scope churn metric' : 'Analytical rework metric'}
          </span>
        </div>
      </div>

      {/* Recharts Trendline or Clean Empty State */}
      {milestones.length === 0 ? (
        <div className="py-12 px-6 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/60 my-2">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border shadow-xs ${
              isRequirements
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-stone-900">
            {isRequirements
              ? 'No Requirements Finalized Yet'
              : 'No Analytics Steps Finalized Yet'}
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
            {isRequirements
              ? 'The timeline journey begins as soon as the FRC Owner clicks "Finalize Requirement" on Step 1. A continuous trend line will map the pacing from the very first step to the latest.'
              : 'The timeline journey begins as soon as the Analyst finalises and submits Step 1 or any completed analytics. The trend line tracks analytical turnaround and pacing against FRC milestones.'}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={milestones}
                margin={{ top: 15, right: 30, left: -10, bottom: 25 }}
              >
                <defs>
                  <linearGradient
                    id={isRequirements ? 'reqGradient' : 'anaGradient'}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={isRequirements ? '#6366f1' : '#2563eb'}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={isRequirements ? '#6366f1' : '#2563eb'}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="stepId"
                  tick={{ fontSize: 11, fill: '#78716c', fontWeight: 600 }}
                  tickLine={{ stroke: '#d6d3d1' }}
                  axisLine={{ stroke: '#d6d3d1' }}
                  dy={10}
                />
                <YAxis
                  dataKey={metricView === 'cumulative' ? 'cumulativeSteps' : 'daysFromFirst'}
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={{ stroke: '#d6d3d1' }}
                  axisLine={{ stroke: '#d6d3d1' }}
                  allowDecimals={false}
                  label={{
                    value:
                      metricView === 'cumulative'
                        ? 'Cumulative Steps Finalized'
                        : 'Calendar Days Elapsed',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#a8a29e', fontSize: 11 },
                    offset: 15,
                  }}
                />
                <Tooltip content={<CustomTooltip isRequirements={isRequirements} />} />
                <Area
                  type="monotone"
                  dataKey={metricView === 'cumulative' ? 'cumulativeSteps' : 'daysFromFirst'}
                  stroke={isRequirements ? '#4f46e5' : '#2563eb'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#${isRequirements ? 'reqGradient' : 'anaGradient'})`}
                  activeDot={{
                    r: 6,
                    fill: isRequirements ? '#4338ca' : '#1d4ed8',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline Milestones Horizontal Strip */}
          <div className="mt-4 pt-3 border-t border-stone-100 overflow-x-auto pb-1">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">
                Milestones Journey:
              </span>
              {milestones.map((m, idx) => (
                <div
                  key={m.stepId}
                  className="flex items-center gap-1.5 bg-stone-50 hover:bg-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200 transition-colors"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRequirements ? 'bg-indigo-600' : 'bg-blue-600'
                    }`}
                  />
                  <span className="font-mono text-xs font-bold text-stone-900">{m.stepId}</span>
                  <span className="text-[10px] text-stone-500 font-medium">{m.displayDate}</span>
                  {m.rerunCount > 0 && !isRequirements && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded">
                      {m.rerunCount} reruns
                    </span>
                  )}
                  {m.refinalizeCount > 0 && isRequirements && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded">
                      {m.refinalizeCount} revs
                    </span>
                  )}
                  {idx < milestones.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-stone-400 ml-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, isRequirements }: any) => {
  if (active && payload && payload.length) {
    const data: MilestonePoint = payload[0].payload;
    return (
      <div className="bg-stone-900 text-white p-3 rounded-xl shadow-xl border border-stone-700 text-xs max-w-xs space-y-1.5 animate-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1.5">
          <span className="font-mono font-bold text-amber-300">{data.stepId}</span>
          <span className="text-[10px] text-stone-400">
            {data.displayDate} • {data.displayTime}
          </span>
        </div>
        <p className="font-semibold text-stone-100 leading-snug line-clamp-2">
          {data.stepTitle}
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-stone-300">
          <div>
            <span className="text-stone-500 block text-[10px]">Journey Progress</span>
            <span className="font-semibold text-white">
              Step {data.cumulativeSteps} of journey
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px]">Working Days</span>
            <span className="font-semibold text-white">{data.workingDays} days</span>
          </div>
          {isRequirements ? (
            <div className="col-span-2">
              <span className="text-stone-500 block text-[10px]">Re-finalization Count</span>
              <span
                className={`font-semibold ${
                  data.refinalizeCount > 0 ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                {data.refinalizeCount > 0
                  ? `${data.refinalizeCount} scope modifications post-lock`
                  : 'Finalized on baseline (0 churn)'}
              </span>
            </div>
          ) : (
            <div className="col-span-2">
              <span className="text-stone-500 block text-[10px]">Analytics Execution</span>
              <span
                className={`font-semibold ${
                  data.rerunCount > 0 ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                {data.rerunCount > 0
                  ? `${data.rerunCount} re-runs executed`
                  : 'Completed on single run'}
              </span>
            </div>
          )}
        </div>
        <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-800">
          Sign-off: <strong>{data.actor}</strong>
        </div>
      </div>
    );
  }
  return null;
};
