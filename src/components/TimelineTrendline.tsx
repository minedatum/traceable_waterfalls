import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  Users,
  ShieldCheck,
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
  category: string;
  timestamp: string;
  displayDate: string;
  displayTime: string;
  fullDateStr: string;
  pointLabel: string;
  rawDate: number;
  cumulativeSteps: number;
  daysFromFirst: number;
  workingDays: number;
  population: number; // In-scope population remaining (cases)
  uniqueAccounts: number; // Unique accounts remaining
  excludeCount: number; // Excluded in this step
  totalDecrease: number; // Cumulative drop from baseline
  decreasePercent: number; // Percentage decrease from baseline
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
  const [metricView, setMetricView] = useState<'population' | 'uniqueAccounts' | 'decrease'>('population');

  // Compute milestones and population decrease over time from the first finalized requirement step
  const {
    milestones,
    firstMilestone,
    startingBaseline,
    minYValue,
    maxYValue,
  } = useMemo(() => {
    const points: MilestonePoint[] = [];

    // Sort rows by step number
    const sortedRows = [...rows].sort((a, b) => a.stepNumber - b.stepNumber);

    // Determine baseline starting population from first row with case count
    let baseline = 0;
    const firstWithCount = sortedRows.find((r) => r.includeCaseCount > 0);
    if (firstWithCount) {
      baseline = firstWithCount.includeCaseCount;
    } else if (sortedRows.length > 0 && sortedRows[0].excludeCount > 0) {
      baseline = sortedRows[0].excludeCount * 10;
    } else {
      baseline = 1000000;
    }

    let runningPopulation = baseline;
    let runningAccounts = sortedRows[0]?.includeUniqueAccountCount || Math.round(baseline * 0.68);

    for (let i = 0; i < sortedRows.length; i++) {
      const row = sortedRows[i];
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
          (row.status === 'ready_for_review' ||
          row.status === 'signed_off' ||
          Boolean(row.analyticsFirstFinalizedAt) ||
          Boolean(row.analyticsCompletedAt)) &&
          row.status !== 'in_analysis' &&
          row.status !== 'draft' &&
          row.status !== 'in_modification' &&
          row.status !== 'step_finalized';

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
        const dateObj = new Date(finalDateStr);
        const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

        // Compute step population
        let stepPopulation = runningPopulation;
        if (row.includeCaseCount > 0) {
          stepPopulation = row.includeCaseCount;
          runningPopulation = row.includeCaseCount;
        } else if (row.excludeCount > 0) {
          stepPopulation = Math.max(0, runningPopulation - row.excludeCount);
          runningPopulation = stepPopulation;
        }

        let stepAccounts = runningAccounts;
        if (row.includeUniqueAccountCount > 0) {
          stepAccounts = row.includeUniqueAccountCount;
          runningAccounts = row.includeUniqueAccountCount;
        } else if (row.excludeCount > 0) {
          const ratio = baseline > 0 ? runningAccounts / baseline : 0.68;
          stepAccounts = Math.max(0, Math.round(stepPopulation * ratio));
          runningAccounts = stepAccounts;
        }

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
          category: row.category,
          timestamp: validDate.toISOString(),
          displayDate: validDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          displayTime: validDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          fullDateStr: validDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          pointLabel: `${row.id} • ${validDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`,
          rawDate: validDate.getTime(),
          cumulativeSteps: 0,
          daysFromFirst: 0,
          workingDays: row.workingDays || 1,
          population: stepPopulation,
          uniqueAccounts: stepAccounts,
          excludeCount: row.excludeCount || 0,
          totalDecrease: Math.max(0, baseline - stepPopulation),
          decreasePercent:
            baseline > 0 ? Math.max(0, ((baseline - stepPopulation) / baseline) * 100) : 0,
          rerunCount: reruns,
          refinalizeCount: refinalizes,
          actor,
          status: row.status,
        });
      }
    }

    // Sort chronologically from the time the first requirement was finalized
    points.sort((a, b) => a.rawDate - b.rawDate);

    // Compute days elapsed from first finalized requirement step
    if (points.length > 0) {
      const originTime = points[0].rawDate;
      points.forEach((p, idx) => {
        p.cumulativeSteps = idx + 1;
        const diffDays = Math.max(0, Math.round((p.rawDate - originTime) / (1000 * 60 * 60 * 24)));
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

    const currentPop = latest ? latest.population : baseline;
    const totalDec = Math.max(0, baseline - currentPop);
    const decPct = baseline > 0 ? (totalDec / baseline) * 100 : 0;

    // Y Axis domain calculations for population view
    const allPops = points.map((p) => p.population);
    const minP = allPops.length > 0 ? Math.min(...allPops) : 0;
    const maxP = allPops.length > 0 ? Math.max(...allPops) : baseline;
    const padding = (maxP - minP) * 0.1 || maxP * 0.1;

    return {
      milestones: points,
      firstMilestone: first,
      latestMilestone: latest,
      startingBaseline: baseline,
      currentPopulation: currentPop,
      totalDecrease: totalDec,
      decreasePercent: decPct,
      totalSpanDays: totalSpan,
      averageDaysPerStep: avgDays,
      minYValue: Math.max(0, Math.floor(minP - padding)),
      maxYValue: Math.ceil(maxP + padding),
    };
  }, [mode, rows]);

  const isRequirements = mode === 'requirements';
  const defaultTitle = isRequirements
    ? 'Project Trendline from First Requirement Finalized'
    : 'Analytics Delivery & Population Scoping Trendline';

  // Y-axis tick formatter for large numbers (1.45M, 980k, etc.)
  const formatYAxisTick = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toLocaleString();
  };

  return (
    <div
      id={`timeline-trendline-${mode}`}
      className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-xs ${className}`}
    >
      {/* Header with Title & Metric View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
              isRequirements
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
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
                {isRequirements ? 'FRC Governance Track' : 'Analyst Scoping Track'}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {firstMilestone
                ? `Trendline from first requirement finalized on ${firstMilestone.displayDate} (${firstMilestone.stepId}) showing population decrease over time.`
                : 'Trendline will start from the time when the first project requirement step is finalized.'}
            </p>
          </div>
        </div>

        {/* View mode toggle: Population (Cases) vs Unique Accounts vs Cumulative Exclusions */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricView('population')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              metricView === 'population'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Plot in-scope case population decrease on Y-axis"
          >
            Population (Cases)
          </button>
          <button
            type="button"
            onClick={() => setMetricView('uniqueAccounts')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              metricView === 'uniqueAccounts'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Plot unique accounts remaining on Y-axis"
          >
            Unique Accounts
          </button>
          <button
            type="button"
            onClick={() => setMetricView('decrease')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              metricView === 'decrease'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Plot total excluded cases over time on Y-axis"
          >
            Cumulative Excluded
          </button>
        </div>
      </div>

      {/* Trendline Chart or Clean Empty State */}
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
              ? 'Awaiting First Requirement Finalization'
              : 'Awaiting First Analytics Finalization'}
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
            The trendline begins as soon as the first requirement is finalized (Step 1). It will
            plot the timeline progression on the X-axis and the continuous population decrease on the
            Y-axis as each subsequent exclusion requirement is locked.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={milestones}
                margin={{ top: 15, right: 30, left: 15, bottom: 35 }}
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
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isRequirements ? '#6366f1' : '#2563eb'}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="pointLabel"
                  tick={{ fontSize: 11, fill: '#78716c', fontWeight: 600 }}
                  tickLine={{ stroke: '#d6d3d1' }}
                  axisLine={{ stroke: '#d6d3d1' }}
                  dy={10}
                  label={{
                    value: firstMilestone
                      ? `Project Timeline (from First Requirement Finalized: ${firstMilestone.displayDate})`
                      : 'Project Timeline',
                    position: 'insideBottom',
                    offset: -20,
                    style: { textAnchor: 'middle', fill: '#78716c', fontSize: 11, fontWeight: 600 },
                  }}
                />
                <YAxis
                  dataKey={
                    metricView === 'population'
                      ? 'population'
                      : metricView === 'uniqueAccounts'
                      ? 'uniqueAccounts'
                      : 'totalDecrease'
                  }
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={{ stroke: '#d6d3d1' }}
                  axisLine={{ stroke: '#d6d3d1' }}
                  tickFormatter={formatYAxisTick}
                  domain={metricView === 'decrease' ? [0, 'auto'] : [minYValue, maxYValue]}
                  label={{
                    value:
                      metricView === 'population'
                        ? 'Population Decrease Over Time (Remaining In-Scope Cases)'
                        : metricView === 'uniqueAccounts'
                        ? 'Unique Accounts Remaining Over Time'
                        : 'Cumulative Population Decrease / Excluded Cases',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#78716c', fontSize: 11, fontWeight: 600 },
                    offset: 5,
                  }}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      isRequirements={isRequirements}
                      startingBaseline={startingBaseline}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey={
                    metricView === 'population'
                      ? 'population'
                      : metricView === 'uniqueAccounts'
                      ? 'uniqueAccounts'
                      : 'totalDecrease'
                  }
                  stroke={isRequirements ? '#4f46e5' : '#2563eb'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#${isRequirements ? 'reqGradient' : 'anaGradient'})`}
                  dot={{
                    r: 5,
                    fill: isRequirements ? '#4f46e5' : '#2563eb',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 7,
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
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Timeline Journey:
              </span>
              {milestones.map((m, idx) => (
                <div
                  key={m.stepId}
                  className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 px-3 py-2 rounded-xl border border-stone-200 transition-colors"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      idx === 0
                        ? 'bg-emerald-500 ring-2 ring-emerald-200'
                        : isRequirements
                        ? 'bg-indigo-600'
                        : 'bg-blue-600'
                    }`}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-stone-900">{m.stepId}</span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {m.displayDate}
                      </span>
                      {idx === 0 && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded uppercase">
                          Origin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-600 font-semibold">
                      <span>{m.population.toLocaleString()} cases</span>
                      {m.excludeCount > 0 && (
                        <span className="text-rose-600 font-medium">
                          (-{m.excludeCount.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                  {idx < milestones.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 ml-1 shrink-0" />
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
const CustomTooltip = ({ active, payload, isRequirements, startingBaseline }: any) => {
  if (active && payload && payload.length) {
    const data: MilestonePoint = payload[0].payload;
    return (
      <div className="bg-stone-900 text-white p-3.5 rounded-xl shadow-xl border border-stone-700 text-xs max-w-xs space-y-2 animate-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-amber-300">{data.stepId}</span>
            <span className="text-[10px] font-semibold text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded">
              Day {data.daysFromFirst}
            </span>
          </div>
          <span className="text-[10px] text-stone-400">
            {data.displayDate} • {data.displayTime}
          </span>
        </div>

        <p className="font-semibold text-stone-100 leading-snug line-clamp-2">
          {data.stepTitle}
        </p>

        {/* Population Details */}
        <div className="bg-stone-800/80 p-2 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-400">Population Remaining:</span>
            <span className="font-bold text-white">{data.population.toLocaleString()} cases</span>
          </div>
          {data.excludeCount > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400">Step Exclusion:</span>
              <span className="font-semibold text-rose-400">
                -{data.excludeCount.toLocaleString()} cases
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-700">
            <span className="text-stone-400">Total Decrease:</span>
            <span className="font-semibold text-amber-300">
              -{data.totalDecrease.toLocaleString()} (-{data.decreasePercent.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-stone-400">
            <span>Unique Accounts:</span>
            <span>{data.uniqueAccounts.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300">
          <div>
            <span className="text-stone-500 block text-[10px]">Timeline Elapsed</span>
            <span className="font-semibold text-white">
              {data.daysFromFirst === 0
                ? 'Day 0 (First Finalized)'
                : `${data.daysFromFirst} days from origin`}
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
