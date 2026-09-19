import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Save,
  Check,
  Play,
  TrendingDown,
  TrendingUp,
  Users,
  FolderOpen,
  Mail,
  Send,
  Copy,
  ExternalLink,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  FileCheck,
  ArrowRight,
  Filter,
  Database,
  LayoutGrid,
  List,
  Layers,
  Scale,
  History,
} from 'lucide-react';
import { WaterfallRow, AnalystTab, AuditLogEntry, ProjectDetails, WaterfallEntity } from '../types';
import { exportWaterfallToExcel, exportAnalystViewToExcel } from '../utils/exportUtils';
import { calculateWorkingDays } from '../utils/workingDays';
import { getWaterfallStatusInfo } from '../utils/statusUtils';
import { TimelineTrendline } from './TimelineTrendline';
import { DisputeResolutionCards } from './DisputeResolutionCards';
import { DisputeAuditLogView } from './DisputeAuditLogView';
import { ProjectDetailsCard } from './ProjectDetailsCard';

interface AnalystWorkspaceProps {
  rows: WaterfallRow[];
  auditLogs?: AuditLogEntry[];
  projectDetails: ProjectDetails;
  waterfalls?: WaterfallEntity[];
  activeWaterfallId?: string;
  onSelectWaterfall?: (waterfallId: string) => void;
  onOpenAddWaterfall?: () => void;
  onOpenCreateProject?: () => void;
  onOpenAuditLogs?: () => void;
  onSaveProjectDetails?: (updated: ProjectDetails) => void;
  activeTab: AnalystTab;
  onTabChange: (tab: AnalystTab) => void;
  onUpdateCountsAndSchedule: (
    rowId: string,
    updates: {
      excludeCount: number;
      includeCaseCount: number;
      includeUniqueAccountCount: number;
      startDate: string;
      endDate: string;
      workingDays: number;
      businessRequirements?: string;
      datasetLocation?: string;
      notes?: string;
      rerunCount?: number;
      analyticsFirstFinalizedAt?: string;
      analyticsLatestFinalizedAt?: string;
    },
    changeSummary?: string
  ) => void;
  onStatusChange: (rowId: string, newStatus: WaterfallRow['status']) => void;
  onTriggerEmailNotification?: (
    rowId: string,
    emailDetails: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => void;
}

export const AnalystWorkspace: React.FC<AnalystWorkspaceProps> = ({
  rows,
  auditLogs = [],
  projectDetails,
  waterfalls,
  activeWaterfallId,
  onSelectWaterfall,
  onOpenAddWaterfall,
  onOpenCreateProject,
  onOpenAuditLogs,
  onSaveProjectDetails,
  activeTab,
  onTabChange,
  onUpdateCountsAndSchedule,
  onStatusChange,
  onTriggerEmailNotification,
}) => {
  // State for filtering logs when navigated from dispute cards
  const [selectedLogStepFilter, setSelectedLogStepFilter] = useState<string>('all');
  // Local state for inline editable fields across the rows table
  const [editedFields, setEditedFields] = useState<
    Record<
      string,
      {
        businessRequirements: string;
        datasetLocation: string;
        excludeCount: number;
        includeCaseCount: number;
        includeUniqueAccountCount: number;
        notes: string;
        startDate: string;
        endDate: string;
        workingDays: number;
        isDirty?: boolean;
      }
    >
  >({});

  const [saveSuccessRowId, setSaveSuccessRowId] = useState<string | null>(null);

  // Raw numeric string drafts so analysts can freely type/delete numbers without steppers or sticky zeros
  const [numericDrafts, setNumericDrafts] = useState<Record<string, Record<string, string>>>({});

  // Active analysis state for row currently running "Start Analytics"
  const [analyzingRowId, setAnalyzingRowId] = useState<string | null>(null);

  // Email Notification Modal state
  const [activeEmailRow, setActiveEmailRow] = useState<WaterfallRow | null>(null);
  const [customRecipient, setCustomRecipient] = useState<string>('');
  const [dispatchedRows, setDispatchedRows] = useState<Record<string, boolean>>({});
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<{
    message: string;
    rowId: string;
  } | null>(null);

  // Finalize & Submit Tab state
  const [finalizedRows, setFinalizedRows] = useState<Record<string, boolean>>({});
  const [finalizedSuccessRowId, setFinalizedSuccessRowId] = useState<string | null>(null);
  const [finalizeFilter, setFinalizeFilter] = useState<'all' | 'ready' | 'submitted'>('all');
  const [stepCustomSubmissionNotes, setStepCustomSubmissionNotes] = useState<Record<string, string>>({});

  // View Mode: Columnar Spreadsheet Table vs Step-by-Step Card View
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Helper to get effective value for each row (local edits override row values)
  const getEffectiveValues = (row: WaterfallRow) => {
    return (
      editedFields[row.id] || {
        businessRequirements: row.businessRequirements || '',
        datasetLocation:
          row.datasetLocation ||
          `H:\\My Drive\\Waterfall\\0${row.stepNumber}_Data\\dataset_${row.id.toLowerCase()}.parquet`,
        excludeCount: row.excludeCount || 0,
        includeCaseCount: row.includeCaseCount || 0,
        includeUniqueAccountCount: row.includeUniqueAccountCount || 0,
        notes: row.notes || '',
        startDate: row.startDate || '',
        endDate: row.endDate || '',
        workingDays: row.workingDays || 0,
        isDirty: false,
      }
    );
  };

  const handleFieldChange = (
    row: WaterfallRow,
    fieldName:
      | 'businessRequirements'
      | 'datasetLocation'
      | 'excludeCount'
      | 'includeCaseCount'
      | 'includeUniqueAccountCount'
      | 'notes'
      | 'startDate'
      | 'endDate'
      | 'workingDays',
    value: string | number
  ) => {
    const current = getEffectiveValues(row);
    const updated = { ...current, isDirty: true };

    if (fieldName === 'businessRequirements') {
      updated.businessRequirements = String(value);
    } else if (fieldName === 'datasetLocation') {
      updated.datasetLocation = String(value);
    } else if (fieldName === 'notes') {
      updated.notes = String(value);
    } else if (fieldName === 'excludeCount') {
      updated.excludeCount = Math.max(0, Number(value) || 0);
    } else if (fieldName === 'includeCaseCount') {
      updated.includeCaseCount = Math.max(0, Number(value) || 0);
    } else if (fieldName === 'includeUniqueAccountCount') {
      updated.includeUniqueAccountCount = Math.max(0, Number(value) || 0);
    } else if (fieldName === 'workingDays') {
      updated.workingDays = Math.max(0, parseInt(String(value), 10) || 0);
    } else if (fieldName === 'startDate') {
      updated.startDate = String(value);
      if (updated.startDate && updated.endDate) {
        updated.workingDays = calculateWorkingDays(updated.startDate, updated.endDate);
      }
    } else if (fieldName === 'endDate') {
      updated.endDate = String(value);
      if (updated.startDate && updated.endDate) {
        updated.workingDays = calculateWorkingDays(updated.startDate, updated.endDate);
      }
    }

    setEditedFields((prev) => ({
      ...prev,
      [row.id]: updated,
    }));
  };

  const handleSaveRow = (row: WaterfallRow) => {
    const values = getEffectiveValues(row);
    const changeSummary = `Analyst Alex Morgan saved draft for row ${row.id}: Requirement="${values.businessRequirements.slice(
      0,
      40
    )}...", Exclude=${values.excludeCount.toLocaleString()}, Include=${values.includeCaseCount.toLocaleString()}, Accounts=${values.includeUniqueAccountCount.toLocaleString()}, Days=${values.workingDays}d.`;

    onUpdateCountsAndSchedule(row.id, values, changeSummary);

    setEditedFields((prev) => ({
      ...prev,
      [row.id]: { ...values, isDirty: false },
    }));

    setSaveSuccessRowId(row.id);
    setTimeout(() => setSaveSuccessRowId(null), 2500);
  };

  const handleNotesBlur = (row: WaterfallRow, noteText: string) => {
    const values = getEffectiveValues(row);
    const updatedNote = noteText.trim();
    if (updatedNote === (row.notes || '').trim()) return;
    const updated = { ...values, notes: updatedNote };
    setEditedFields((prev) => ({
      ...prev,
      [row.id]: updated,
    }));
    onUpdateCountsAndSchedule(
      row.id,
      updated,
      `Analyst Alex Morgan updated notes for ${row.id}: "${updatedNote.slice(0, 40)}${updatedNote.length > 40 ? '...' : ''}"`
    );
  };

  // Helper to compile email payload for Project Team (Analyst + Project Manager + FRC)
  const buildEmailData = (row: WaterfallRow, type: 'start' | 'submission' = 'start') => {
    const values = getEffectiveValues(row);
    const primaryRecipients = [
      'marcus.vance.pmo@enterprise.bank', // Project Manager (PMO)
      'alex.morgan@enterprise.bank', // Lead Analyst
      'waterfall.team@enterprise.bank', // Project Team
    ];
    if (customRecipient && customRecipient.trim().includes('@')) {
      primaryRecipients.push(customRecipient.trim());
    }

    const ccRecipients = ['sarah.jenkins@enterprise.bank']; // FRC Owner

    // If FRC dispatched an email for modification or finalization, use that content
    if (row.lastEmailSubject && row.lastEmailBody) {
      return {
        primaryRecipients,
        ccRecipients,
        subject: row.lastEmailSubject,
        bodyText: row.lastEmailBody,
        values,
      };
    }

    if (row.status === 'in_modification') {
      return {
        primaryRecipients,
        ccRecipients,
        subject: `[Waterfall Requirement Alert] FRC is Modifying Step WFID# ${row.id}: ${row.stepTitle}`,
        bodyText: `Dear Project Team (Analyst & Project Manager),\n\nPlease be advised that FRC Owner Sarah Jenkins has initiated a MODIFICATION of the requirement specification for Waterfall Step WFID# ${row.id} (${row.stepTitle}).\n\n==================================================\nMODIFICATION NOTICE\n==================================================\n• Step ID           : WFID# ${row.id}\n• Step Title        : ${row.stepTitle}\n• Current Status    : IN MODIFICATION\n• Triggered By      : Sarah Jenkins (FRC Owner)\n• Assigned Analyst  : ${row.assignedAnalyst}\n\nACTION REQUIRED:\nAnalyst calculations should be held pending FRC revised submission.\n\nAutomated notification generated by eGRC Waterfall Management Portal.`,
        values,
      };
    }

    const isStart = type === 'start';
    const subject = isStart
      ? `[Waterfall Alert] Step WFID# ${row.id} Analytics Started: ${row.stepTitle}`
      : `[Waterfall Submission] Step WFID# ${row.id} Finalised & Submitted: ${row.stepTitle}`;

    const bodyText = `Dear Project Team (Project Manager & Analyst),

${
  isStart
    ? `Analytics for Waterfall Step WFID# ${row.id} has been STARTED by Analyst Alex Morgan. The requirement is actively under quantitative validation and schedule formulation.`
    : `Waterfall Step WFID# ${row.id} has been FINALISED AND SUBMITTED by Analyst Alex Morgan. Quantitative case/account exclusions and schedule allocations are finalized for FRC requirement finalisation.`
}

==================================================
STEP SPECIFICATIONS & STATUS
==================================================
• Waterfall Step ID : ${row.id} (Step ${row.stepNumber})
• Step Title        : ${row.stepTitle}
• Category          : ${row.category}
• Rule Reference    : ${row.ruleReference}
• Current Status    : ${isStart ? 'ANALYTICS IN PROGRESS' : 'READY FOR REVIEW (SUBMITTED)'}

==================================================
BUSINESS REQUIREMENTS
==================================================
${values.businessRequirements || row.businessRequirements || 'N/A'}

==================================================
DATASET REPOSITORY LOCATION
==================================================
${values.datasetLocation || row.datasetLocation || 'N/A'}

==================================================
QUANTITATIVE CASE & ACCOUNT BREAKDOWN
==================================================
• Exclude Count (Case Level)  : ${values.excludeCount.toLocaleString()} cases
• Include Count (Case Level)  : ${values.includeCaseCount.toLocaleString()} cases
• Unique Count (Account Level): ${values.includeUniqueAccountCount.toLocaleString()} accounts

==================================================
SCHEDULE & DAYS ALLOCATION
==================================================
• Days Needed     : ${values.workingDays} Working Days
• Schedule Window : ${values.startDate || 'TBD'} to ${values.endDate || 'TBD'}
• Assigned Analyst: Alex Morgan (Lead Risk Analyst)
• Project Manager : Marcus Vance (PMO Delivery Lead)
• FRC Owner       : Sarah Jenkins (Regulatory Compliance Lead)

==================================================
OPTIONAL NOTES & ASSUMPTIONS
==================================================
${values.notes || row.notes || 'None noted'}

Google Drive Project Repository:
H:\\My Drive\\Waterfall\\0${row.stepNumber}_Data

NEXT STEPS:
${
  isStart
    ? `1. Analyst Alex Morgan continues analytical formulation (Save as Draft or directly Finalise).
2. FRC View displays "Analytics in progress" while FRC may continue adding required waterfall steps.
3. Project Manager: Track sprint calendar alignment.`
    : `1. FRC Owner Sarah Jenkins: Perform governance requirement finalisation in the FRC Scoping Workspace.
2. Project Manager Marcus Vance: Finalize baseline schedule tracking.
3. Audit Log: Step locked for governance sign-off.`
}

Automated notification generated by eGRC Waterfall Management Portal.`;

    return {
      primaryRecipients,
      ccRecipients,
      subject,
      bodyText,
      values,
    };
  };

  // EXECUTE "START ANALYTICS" ON A WATERFALL ROW
  const handleStartAnalytics = (row: WaterfallRow) => {
    setAnalyzingRowId(row.id);

    // Check if this is an analytical re-run
    const isRerun = Boolean(
      dispatchedRows[row.id] ||
      row.emailTriggeredAt ||
      row.analyticsCompletedAt ||
      row.status === 'in_analysis' ||
      row.status === 'ready_for_review' ||
      row.status === 'signed_off' ||
      (row.rerunCount && row.rerunCount > 0)
    );
    const newRerunCount = isRerun ? (row.rerunCount || 0) + 1 : (row.rerunCount || 0);

    // Save pending row changes first
    const values = getEffectiveValues(row);
    onUpdateCountsAndSchedule(
      row.id,
      {
        ...values,
        rerunCount: newRerunCount,
      },
      isRerun
        ? `Analytics Re-run #${newRerunCount} executed for ${row.id}. Quantitative validation re-computed: Exclude=${values.excludeCount.toLocaleString()}, Include=${values.includeCaseCount.toLocaleString()}, Unique=${values.includeUniqueAccountCount.toLocaleString()}, Days=${values.workingDays}d.`
        : `Start Analytics executed for ${row.id}. Quantitative validation started: Exclude=${values.excludeCount.toLocaleString()}, Include=${values.includeCaseCount.toLocaleString()}, Unique=${values.includeUniqueAccountCount.toLocaleString()}, Days=${values.workingDays}d.`
    );

    // Simulate analytical engine run (500ms tactile delay)
    setTimeout(() => {
      setAnalyzingRowId(null);

      // Keep in_analysis status so FRC view shows "Analytics in progress"
      if (row.status !== 'signed_off') {
        onStatusChange(row.id, 'in_analysis');
      }

      // Compile email trigger
      const emailData = buildEmailData(row, 'start');

      // Trigger upstream notification & audit log entry
      if (onTriggerEmailNotification) {
        onTriggerEmailNotification(row.id, {
          recipients: [...emailData.primaryRecipients, ...emailData.ccRecipients],
          subject: emailData.subject,
          body: emailData.bodyText,
          stepTitle: row.stepTitle,
        });
      }

      setDispatchedRows((prev) => ({ ...prev, [row.id]: true }));
      setActiveEmailRow(row);
      setNotificationToast({
        message: `Analytics started for WFID# ${row.id}. Project Team alerted; status set to "Analytics in progress".`,
        rowId: row.id,
      });

      setTimeout(() => {
        setNotificationToast(null);
      }, 7000);
    }, 550);
  };

  // Copy email text to clipboard
  const handleCopyEmail = (row: WaterfallRow) => {
    const emailData = buildEmailData(row);
    navigator.clipboard.writeText(emailData.bodyText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  // Launch Native mailto: link
  const handleOpenMailto = (row: WaterfallRow) => {
    const emailData = buildEmailData(row);
    const to = emailData.primaryRecipients.join(',');
    const cc = emailData.ccRecipients.join(',');
    const subject = encodeURIComponent(emailData.subject);
    const body = encodeURIComponent(emailData.bodyText);
    const mailto = `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`;
    window.open(mailto, '_blank');
  };

  // FINALISE AND SUBMIT STEP ACTION (Analyst formal submission to PMO & FRC)
  const handleFinalizeAndSubmitRow = (row: WaterfallRow, customNotes?: string) => {
    const vals = getEffectiveValues(row);
    const finalNote =
      customNotes ||
      stepCustomSubmissionNotes[row.id] ||
      vals.notes ||
      'Step finalised and submitted by Analyst Alex Morgan. Analytics criteria and Drive partitions verified.';

    const nowIso = new Date().toISOString();
    onUpdateCountsAndSchedule(
      row.id,
      {
        ...vals,
        notes: finalNote,
        analyticsFirstFinalizedAt: row.analyticsFirstFinalizedAt || nowIso,
        analyticsLatestFinalizedAt: nowIso,
      },
      `Analyst Alex Morgan finalised and submitted step ${row.id} to Project Manager (Marcus Vance) and FRC Governance Owner (Sarah Jenkins). Exclude=${vals.excludeCount.toLocaleString()}, Include=${vals.includeCaseCount.toLocaleString()}, Accounts=${vals.includeUniqueAccountCount.toLocaleString()}, Days=${vals.workingDays}d.`
    );

    // Set status to ready_for_review / submitted
    onStatusChange(row.id, 'ready_for_review');

    setFinalizedRows((prev) => ({ ...prev, [row.id]: true }));
    setFinalizedSuccessRowId(row.id);

    // Also trigger email notification to Project Team
    const emailData = buildEmailData(row);
    if (onTriggerEmailNotification) {
      onTriggerEmailNotification(row.id, {
        recipients: [...emailData.primaryRecipients, ...emailData.ccRecipients],
        subject: `[FINAL SUBMISSION] Step WFID# ${row.id} Finalised & Submitted: ${row.stepTitle}`,
        body: `ATTN: Project Manager (Marcus Vance) & FRC Owner (Sarah Jenkins),\n\nLead Analyst Alex Morgan has officially FINALISED AND SUBMITTED Waterfall Step WFID# ${row.id} for formal sign-off.\n\n` + emailData.bodyText,
        stepTitle: row.stepTitle,
      });
    }

    setNotificationToast({
      message: `✓ Step WFID# ${row.id} finalised and submitted to Project Manager & FRC Owner!`,
      rowId: row.id,
    });

    setTimeout(() => {
      setFinalizedSuccessRowId(null);
    }, 3000);

    setTimeout(() => {
      setNotificationToast(null);
    }, 7000);
  };

  // Batch Finalise and Submit All Ready Steps
  const handleBatchFinalizeAll = () => {
    rows.forEach((row) => {
      if (row.status !== 'signed_off') {
        handleFinalizeAndSubmitRow(row);
      }
    });
    setNotificationToast({
      message: `✓ All in-scope waterfall steps finalised and submitted to the Project Team!`,
      rowId: 'all',
    });
  };

  // Helper calculations
  const totalExcluded = rows.reduce((sum, r) => sum + (r.excludeCount || 0), 0);
  const totalIncluded = rows.reduce((sum, r) => sum + (r.includeCaseCount || 0), 0);
  const totalAccounts = rows.reduce((sum, r) => sum + (r.includeUniqueAccountCount || 0), 0);
  const totalDays = rows.reduce((sum, r) => sum + (r.workingDays || 0), 0);
  const completedSteps = rows.filter(
    (r) => r.status === 'signed_off' || r.status === 'ready_for_review'
  );
  const emailDispatchedCount = rows.filter(
    (r) => dispatchedRows[r.id] || r.emailTriggeredAt || r.analyticsCompletedAt
  ).length;

  const finalizedCount = rows.filter(
    (r) => finalizedRows[r.id] || r.status === 'ready_for_review' || r.status === 'signed_off'
  ).length;

  const readyToFinalizeCount = rows.filter(
    (r) =>
      r.status !== 'signed_off' &&
      r.status !== 'ready_for_review' &&
      (dispatchedRows[r.id] ||
        r.status === 'in_analysis' ||
        Boolean(r.analyticsCompletedAt))
  ).length;

  useEffect(() => {
    if (activeTab === 'finalize') {
      onTabChange('table');
    }
  }, [activeTab, onTabChange]);

  return (
    <div id="analyst-workspace" className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification Banner when Email is Triggered / Step Finalised */}
      {notificationToast && (
        <div className="bg-stone-900 text-white p-3.5 rounded-xl border border-stone-700 shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {notificationToast.message}
              </p>
              <p className="text-[11px] text-stone-300">
                Recipients: Project Manager (Marcus Vance), Analyst (Alex Morgan), User &amp; FRC Owner
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notificationToast.rowId !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  const targetRow = rows.find((r) => r.id === notificationToast.rowId);
                  if (targetRow) setActiveEmailRow(targetRow);
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
              >
                View Email Dispatch
              </button>
            )}
            <button
              type="button"
              onClick={() => setNotificationToast(null)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Permanent Issue & Project Details Specification */}
      <ProjectDetailsCard
        projectDetails={projectDetails}
        userRole="analyst"
        onSaveProjectDetails={onSaveProjectDetails || (() => {})}
        waterfalls={waterfalls}
        activeWaterfallId={activeWaterfallId}
        onSelectWaterfall={onSelectWaterfall}
        onOpenAddWaterfall={onOpenAddWaterfall}
        onOpenCreateProject={onOpenCreateProject}
      />

      {/* Top Header Card with Tabs & Actions Aligned Straight */}
      <div className="bg-white rounded-2xl border border-stone-200 px-4 sm:px-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs: Waterfall Requirements & Complete Analytics Summary */}
          <div className="flex items-center text-xs font-semibold overflow-x-auto border-b md:border-b-0 border-stone-200">
            {/* Tab 1: Waterfall Requirements Table */}
            <button
              type="button"
              id="tab-waterfall-table"
              onClick={() => onTabChange('table')}
              className={`py-3 px-4 sm:px-5 border-b-2 transition-all flex items-center gap-2 text-sm whitespace-nowrap ${
                activeTab === 'table' || activeTab === 'start'
                  ? 'border-stone-900 text-stone-900 font-bold bg-stone-50/70'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <FileSpreadsheet
                className={`w-4 h-4 ${
                  activeTab === 'table' || activeTab === 'start' ? 'text-blue-600' : 'text-stone-400'
                }`}
              />
              Waterfall Requirements
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono font-bold">
                {rows.length} Steps
              </span>
            </button>

            {/* Tab 2: Complete Analytics */}
            <button
              type="button"
              id="tab-complete-analytics"
              onClick={() => onTabChange('complete')}
              className={`py-3 px-4 sm:px-5 border-b-2 transition-all flex items-center gap-2 text-sm whitespace-nowrap ${
                activeTab === 'complete'
                  ? 'border-stone-900 text-stone-900 font-bold bg-stone-50/70'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 ${activeTab === 'complete' ? 'text-emerald-600' : 'text-stone-400'}`}
              />
              Complete Analytics Summary
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-mono font-bold">
                Funnel &amp; Rollup
              </span>
            </button>
          </div>

          {/* Action Buttons: Export Waterfall & Logs aligned straight on the right */}
          <div className="flex items-center gap-2 shrink-0 py-2 self-end md:self-auto">
            <button
              type="button"
              id="btn-export-excel-analyst"
              onClick={() => {
                const syncedWaterfalls = (waterfalls || []).map((wf) =>
                  wf.id === activeWaterfallId ? { ...wf, rows } : wf
                );
                exportAnalystViewToExcel(rows, editedFields, 'Waterfall_Analyst_Requirements.xlsx', projectDetails, syncedWaterfalls);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              title="Download Excel version replicating all analyst requirement columns and numbers (.xlsx) with all project waterfalls in separate sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              Export Waterfall
            </button>
            <button
              type="button"
              id="btn-open-logs-analyst"
              onClick={() => {
                if (onOpenAuditLogs) {
                  onOpenAuditLogs();
                } else {
                  onTabChange('dispute_logs');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 transition-colors shadow-2xs"
              title="View real-time activity and change audit logs with timestamps"
            >
              <History className="w-3.5 h-3.5 text-stone-600" />
              Logs
              {auditLogs && auditLogs.length > 0 && (
                <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {auditLogs.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WATERFALL REQUIREMENTS TABLE (Columnar Table with Per-Row Start Analytics Button) */}
      {/* ========================================================================= */}
      {(activeTab === 'table' || activeTab === 'start') && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* View Mode Switcher */}
          <div className="flex items-center justify-end">
            <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
                title="View full columnar spreadsheet table"
              >
                <List className="w-3.5 h-3.5" />
                Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
                title="View step-by-step card format"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Card View
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: COLUMNAR SPREADSHEET TABLE */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table id="analyst-waterfall-table" className="w-full text-xs text-left border-collapse">
                  <thead className="bg-stone-900 text-white font-semibold uppercase text-[11px] tracking-wider border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-3 w-20 text-center">WFID#</th>
                      <th className="py-3 px-3 w-56 min-w-[180px]">Step Rationale</th>
                      <th className="py-3 px-3 w-60 min-w-[190px]">Business Requirements</th>
                      <th className="py-3 px-3 w-48 min-w-[150px]">Dataset Location</th>
                      <th className="py-3 px-3 w-28 text-right bg-rose-950/40 text-rose-200">
                        Exclude Count
                        <span className="block text-[9px] font-normal normal-case text-rose-300">Case Level</span>
                      </th>
                      <th className="py-3 px-3 w-28 text-right bg-emerald-950/40 text-emerald-200">
                        Include Count
                        <span className="block text-[9px] font-normal normal-case text-emerald-300">Case Level</span>
                      </th>
                      <th className="py-3 px-3 w-28 text-right bg-blue-950/40 text-blue-200">
                        Unique Count
                        <span className="block text-[9px] font-normal normal-case text-blue-300">Account Level</span>
                      </th>
                      <th className="py-3 px-3 w-44 min-w-[140px]">Optional Notes</th>
                      <th className="py-3 px-3 w-32 text-center bg-stone-800">
                        Days Count
                        <span className="block text-[9px] font-normal normal-case text-stone-300">Working Days</span>
                      </th>
                      <th className="py-3 px-3 w-44 min-w-[165px] text-center bg-stone-800 text-stone-100">
                        Actions &amp; Status
                        <span className="block text-[9px] font-normal normal-case text-stone-300">
                          Execution &amp; Review
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-sans">
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-stone-500">
                          <div className="max-w-md mx-auto space-y-2">
                            <Database className="w-8 h-8 text-stone-300 mx-auto" />
                            <p className="font-semibold text-stone-800 text-sm">No Requirements Formulated Yet</p>
                            <p className="text-xs text-stone-500">
                              The workspace is in clean slate first-time state. Switch to the <strong>FRC Workspace</strong> to formulate initial population or scoping exclusion rules.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {rows.map((row) => {
                      const vals = getEffectiveValues(row);
                      const isSaved = saveSuccessRowId === row.id;
                      const isAnalyzing = analyzingRowId === row.id;
                      const isEmailTriggered =
                        dispatchedRows[row.id] ||
                        Boolean(row.emailTriggeredAt) ||
                        Boolean(row.analyticsCompletedAt);
                      const isFinalized =
                        finalizedRows[row.id] ||
                        row.status === 'ready_for_review' ||
                        row.status === 'signed_off';
                      const isRowStarted =
                        row.status === 'in_analysis' ||
                        row.status === 'ready_for_review' ||
                        row.status === 'signed_off' ||
                        Boolean(dispatchedRows[row.id]) ||
                        Boolean(row.analyticsCompletedAt);

                      return (
                        <tr
                          key={row.id}
                          id={`row-${row.id}`}
                          className={`transition-colors hover:bg-stone-50/80 ${
                            vals.isDirty ? 'bg-amber-50/40 ring-1 ring-inset ring-amber-300' : ''
                          }`}
                        >
                          {/* Col 1: WFID# */}
                          <td className="py-3 px-3 text-center align-top">
                            <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded border border-stone-300 shadow-2xs inline-block">
                              {row.id}
                            </span>
                          </td>

                          {/* Col 2: Step Rationale */}
                        <td className="py-3 px-3 align-top">
                          <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                            {row.rationale || row.stepTitle}
                          </p>
                        </td>

                        {/* Col 3: Business Requirements (Analyst can modify once started) */}
                        <td className="py-3 px-3 align-top">
                          <div className="space-y-1">
                            <textarea
                              id={`req-${row.id}`}
                              rows={3}
                              disabled={!isRowStarted || isFinalized || row.status === 'in_modification'}
                              value={vals.businessRequirements}
                              onChange={(e) =>
                                handleFieldChange(row, 'businessRequirements', e.target.value)
                              }
                              placeholder={
                                !isRowStarted
                                  ? "Click 'Start Analytics' button to unlock this step and edit requirements..."
                                  : "Specify regulatory mandate or business requirement logic..."
                              }
                              className={`w-full px-2.5 py-1.5 text-xs rounded-lg outline-hidden font-normal leading-relaxed resize-y ${
                                !isRowStarted
                                  ? 'bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed'
                                  : 'text-stone-900 bg-white border border-stone-300 focus:ring-2 focus:ring-stone-900 focus:border-stone-900'
                              }`}
                            />
                            <span className="text-[10px] text-stone-400 block">
                              {!isRowStarted ? 'Locked until Start Analytics is clicked' : 'Editable requirement definition'}
                            </span>
                          </div>
                        </td>

                        {/* Col 4: Path of Dataset Location */}
                        <td className="py-3 px-3 align-top">
                          <div className="space-y-1">
                            <div className="relative">
                              <input
                                type="text"
                                id={`path-${row.id}`}
                                disabled={!isRowStarted || isFinalized || row.status === 'in_modification'}
                                value={vals.datasetLocation}
                                onChange={(e) =>
                                  handleFieldChange(row, 'datasetLocation', e.target.value)
                                }
                                placeholder={!isRowStarted ? 'Locked until started' : 'H:\\My Drive\\Waterfall\\...'}
                                className={`w-full pl-2 pr-6 py-1.5 text-[11px] font-mono rounded-lg ${
                                  !isRowStarted
                                    ? 'bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed'
                                    : 'text-stone-800 bg-stone-50 border border-stone-300 focus:bg-white focus:ring-2 focus:ring-stone-900 focus:outline-hidden'
                                }`}
                              />
                              <FolderOpen className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-2.5 pointer-events-none" />
                            </div>
                            <span className="text-[10px] text-stone-400 block font-mono truncate">
                              Drive partition or extract file
                            </span>
                          </div>
                        </td>

                        {/* Col 5: Exclude Count Case Level */}
                        <td className="py-3 px-3 align-top text-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            id={`exclude-${row.id}`}
                            disabled={!isRowStarted || isFinalized || row.status === 'in_modification'}
                            value={
                              numericDrafts[row.id]?.excludeCount !== undefined
                                ? numericDrafts[row.id].excludeCount
                                : (vals.excludeCount ?? 0)
                            }
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, '');
                              setNumericDrafts((prev) => ({
                                ...prev,
                                [row.id]: {
                                  ...(prev[row.id] || {}),
                                  excludeCount: clean,
                                },
                              }));
                              handleFieldChange(row, 'excludeCount', clean === '' ? 0 : Number(clean));
                            }}
                            onBlur={() => {
                              setNumericDrafts((prev) => {
                                const next = { ...prev };
                                if (next[row.id]) {
                                  delete next[row.id].excludeCount;
                                }
                                return next;
                              });
                            }}
                            className={`w-full text-right px-2.5 py-1.5 font-mono font-bold text-xs rounded-lg ${
                              !isRowStarted
                                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                : 'text-rose-700 bg-rose-50/50 border border-rose-200 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden'
                            }`}
                          />
                          <span className="text-[10px] text-stone-400 block mt-1 font-mono">
                            {vals.excludeCount > 0 ? `-${vals.excludeCount.toLocaleString()}` : '0'}
                          </span>
                        </td>

                        {/* Col 6: Include Count Case Level */}
                        <td className="py-3 px-3 align-top text-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            id={`include-cases-${row.id}`}
                            disabled={!isRowStarted || isFinalized || row.status === 'in_modification'}
                            value={
                              numericDrafts[row.id]?.includeCaseCount !== undefined
                                ? numericDrafts[row.id].includeCaseCount
                                : (vals.includeCaseCount ?? 0)
                            }
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, '');
                              setNumericDrafts((prev) => ({
                                ...prev,
                                [row.id]: {
                                  ...(prev[row.id] || {}),
                                  includeCaseCount: clean,
                                },
                              }));
                              handleFieldChange(row, 'includeCaseCount', clean === '' ? 0 : Number(clean));
                            }}
                            onBlur={() => {
                              setNumericDrafts((prev) => {
                                const next = { ...prev };
                                if (next[row.id]) {
                                  delete next[row.id].includeCaseCount;
                                }
                                return next;
                              });
                            }}
                            className={`w-full text-right px-2.5 py-1.5 font-mono font-bold text-xs rounded-lg ${
                              !isRowStarted
                                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                : 'text-emerald-800 bg-emerald-50/50 border border-emerald-200 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden'
                            }`}
                          />
                          <span className="text-[10px] text-stone-400 block mt-1 font-mono">
                            {vals.includeCaseCount.toLocaleString()} cases
                          </span>
                        </td>

                        {/* Col 7: Unique Level Count (Account level) */}
                        <td className="py-3 px-3 align-top text-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            id={`unique-accounts-${row.id}`}
                            disabled={!isRowStarted || isFinalized || row.status === 'in_modification'}
                            value={
                              numericDrafts[row.id]?.includeUniqueAccountCount !== undefined
                                ? numericDrafts[row.id].includeUniqueAccountCount
                                : (vals.includeUniqueAccountCount ?? 0)
                            }
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, '');
                              setNumericDrafts((prev) => ({
                                ...prev,
                                [row.id]: {
                                  ...(prev[row.id] || {}),
                                  includeUniqueAccountCount: clean,
                                },
                              }));
                              handleFieldChange(
                                row,
                                'includeUniqueAccountCount',
                                clean === '' ? 0 : Number(clean)
                              );
                            }}
                            onBlur={() => {
                              setNumericDrafts((prev) => {
                                const next = { ...prev };
                                if (next[row.id]) {
                                  delete next[row.id].includeUniqueAccountCount;
                                }
                                return next;
                              });
                            }}
                            className={`w-full text-right px-2.5 py-1.5 font-mono font-bold text-xs rounded-lg ${
                              !isRowStarted
                                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                : 'text-blue-900 bg-blue-50/50 border border-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden'
                            }`}
                          />
                          <span className="text-[10px] text-stone-400 block mt-1 font-mono">
                            {vals.includeUniqueAccountCount.toLocaleString()} accts
                          </span>
                        </td>

                        {/* Col 8: Optional Notes */}
                        <td className="py-3 px-3 align-top">
                          <textarea
                            rows={2}
                            id={`notes-${row.id}`}
                            value={vals.notes}
                            onChange={(e) =>
                              handleFieldChange(row, 'notes', e.target.value)
                            }
                            onBlur={(e) => handleNotesBlur(row, e.target.value)}
                            placeholder="Data assumptions, exceptions, or NA..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg outline-hidden font-normal resize-y text-stone-800 bg-white border border-stone-300 focus:ring-2 focus:ring-stone-900 shadow-2xs"
                          />
                        </td>

                        {/* Col 9: Days Count (As is currently + calendar or direct numeric entry) */}
                        <td className="py-3 px-3 align-top text-center">
                          <div className="space-y-1.5 bg-stone-50 p-2 rounded-xl border border-stone-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="off"
                                id={`days-${row.id}`}
                                disabled={!isRowStarted || isFinalized || row.status === 'in_modification'}
                                value={
                                  numericDrafts[row.id]?.workingDays !== undefined
                                    ? numericDrafts[row.id].workingDays
                                    : (vals.workingDays ?? 0)
                                }
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/[^0-9]/g, '');
                                  setNumericDrafts((prev) => ({
                                    ...prev,
                                    [row.id]: {
                                      ...(prev[row.id] || {}),
                                      workingDays: clean,
                                    },
                                  }));
                                  handleFieldChange(row, 'workingDays', clean === '' ? 0 : parseInt(clean, 10));
                                }}
                                onBlur={() => {
                                  setNumericDrafts((prev) => {
                                    const next = { ...prev };
                                    if (next[row.id]) {
                                      delete next[row.id].workingDays;
                                    }
                                    return next;
                                  });
                                }}
                                className={`w-16 text-center font-mono font-bold text-xs rounded-md py-1 ${
                                  !isRowStarted
                                    ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                    : 'text-blue-700 bg-white border border-stone-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden'
                                }`}
                              />
                              <span className="text-xs font-bold text-stone-700">Days</span>
                            </div>

                            {/* Start & End Dates Pickers */}
                            <div className="text-[10px] text-stone-500 space-y-1 pt-1 border-t border-stone-200/80">
                              <div className="flex items-center justify-between gap-1">
                                <span>Start:</span>
                                <input
                                  type="date"
                                  disabled={!isRowStarted || isFinalized || row.status === 'in_modification'}
                                  value={vals.startDate}
                                  onChange={(e) =>
                                    handleFieldChange(row, 'startDate', e.target.value)
                                  }
                                  className="w-24 text-[10px] bg-white border border-stone-200 rounded px-1 py-0.5 text-stone-800 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span>End:</span>
                                <input
                                  type="date"
                                  disabled={!isRowStarted || isFinalized || row.status === 'in_modification'}
                                  value={vals.endDate}
                                  onChange={(e) =>
                                    handleFieldChange(row, 'endDate', e.target.value)
                                  }
                                  className="w-24 text-[10px] bg-white border border-stone-200 rounded px-1 py-0.5 text-stone-800 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Col 10: Actions & Status (Start Analytics Button at the end of each waterfall row) */}
                        <td className="py-3 px-3 align-top text-center">
                          <div className="flex flex-col gap-1.5 min-w-[155px]">
                            {/* 1. CASE: IN MODIFICATION BY FRC */}
                            {row.status === 'in_modification' ? (
                              <div className="space-y-1.5">
                                <div className="w-full py-1.5 px-2 bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs animate-pulse">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>In Modification</span>
                                </div>
                                <div className="text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 text-center font-medium leading-tight">
                                  FRC modifying requirement. Analytics paused.
                                </div>
                                <button
                                  type="button"
                                  id={`btn-view-frc-alert-${row.id}`}
                                  onClick={() => setActiveEmailRow(row)}
                                  className="w-full py-1 px-1.5 text-[10px] font-semibold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Mail className="w-3 h-3 text-amber-700" />
                                  View FRC Alert
                                </button>
                              </div>
                            ) : !isRowStarted ? (
                              /* 2. CASE: NOT YET STARTED - USER REQUEST: button at end of each waterfall row saying start analytics */
                              <div className="space-y-1.5">
                                <button
                                  type="button"
                                  id={`btn-start-analytics-${row.id}`}
                                  onClick={() => handleStartAnalytics(row)}
                                  disabled={isAnalyzing}
                                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 ring-2 ring-blue-400/40"
                                  title="Click to start analytics on this step and send automated email alert to Project Team"
                                >
                                  {isAnalyzing ? (
                                    <>
                                      <RotateCcw className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                                      <span>Starting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                                      <span>Start Analytics</span>
                                    </>
                                  )}
                                </button>
                                <div className="flex items-center justify-center gap-1 text-[10px] text-blue-800 font-medium">
                                  <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span>Triggers team email</span>
                                </div>
                                <div className="pt-0.5 flex justify-center">
                                  {(() => {
                                    const statusInfo = getWaterfallStatusInfo(row.status);
                                    return (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${statusInfo.badgeClass}`}
                                      >
                                        {statusInfo.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            ) : isFinalized ? (
                              /* 3. CASE: SUBMITTED OR REQUIREMENT FINALIZED */
                              <div className="space-y-1.5 bg-stone-50 p-2 rounded-xl border border-stone-200">
                                <div className="flex justify-center">
                                  {(() => {
                                    const statusInfo = getWaterfallStatusInfo(row.status);
                                    return (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${statusInfo.badgeClass}`}
                                      >
                                        {statusInfo.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveEmailRow(row)}
                                  className="w-full py-1.5 px-2 text-[10px] font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 rounded-lg border border-stone-300 flex items-center justify-center gap-1 transition-colors shadow-2xs"
                                  title="View email notifications for this step"
                                >
                                  <Mail className="w-3.5 h-3.5 text-stone-500" />
                                  View Email Trail
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartAnalytics(row)}
                                  className="w-full py-1 px-1 text-[9px] font-semibold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 rounded border border-blue-200 flex items-center justify-center gap-1 transition-colors"
                                  title="Re-run analytics pipeline and trigger team email alert"
                                >
                                  <RotateCcw className="w-2.5 h-2.5 text-blue-600" />
                                  Re-run Analytics
                                </button>
                              </div>
                            ) : (
                              /* 4. CASE: ANALYTICS STARTED & IN PROGRESS */
                              <div className="space-y-1.5">
                                {/* Optional Save as Draft */}
                                <button
                                  type="button"
                                  id={`btn-save-draft-${row.id}`}
                                  onClick={() => handleSaveRow(row)}
                                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-2xs ${
                                    isSaved
                                      ? 'bg-emerald-600 text-white'
                                      : vals.isDirty
                                      ? 'bg-stone-900 hover:bg-stone-800 text-white animate-pulse'
                                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300'
                                  }`}
                                  title="Save draft so work can be continued for as long as needed"
                                >
                                  {isSaved ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                                      Draft Saved!
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-3 h-3" />
                                      Save as Draft
                                    </>
                                  )}
                                </button>

                                {/* Finalise & Submit Step */}
                                <button
                                  type="button"
                                  id={`btn-finalize-${row.id}`}
                                  onClick={() => handleFinalizeAndSubmitRow(row)}
                                  className="w-full py-1.5 px-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs flex items-center justify-center gap-1 transition-colors"
                                  title="Finalise and submit this step to Project Manager & FRC Governance Owner"
                                >
                                  <Send className="w-3 h-3 text-white" />
                                  Finalise &amp; Submit
                                </button>

                                <div className="pt-0.5 flex justify-center">
                                  {(() => {
                                    const statusInfo = getWaterfallStatusInfo(row.status);
                                    return (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${statusInfo.badgeClass}`}
                                      >
                                        {statusInfo.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VIEW MODE 2: RESPONSIVE STEP CARDS */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((row) => {
              const vals = getEffectiveValues(row);
              const isSaved = saveSuccessRowId === row.id;
              const isAnalyzing = analyzingRowId === row.id;
              const isEmailTriggered =
                dispatchedRows[row.id] ||
                Boolean(row.emailTriggeredAt) ||
                Boolean(row.analyticsCompletedAt);
              const isFinalized =
                finalizedRows[row.id] ||
                row.status === 'ready_for_review' ||
                row.status === 'signed_off';
              const isRowStarted =
                row.status === 'in_analysis' ||
                row.status === 'ready_for_review' ||
                row.status === 'signed_off' ||
                Boolean(dispatchedRows[row.id]) ||
                Boolean(row.analyticsCompletedAt);

              return (
                <div
                  key={row.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 transition-all ${
                    !isRowStarted
                      ? 'border-blue-200 bg-linear-to-b from-blue-50/40 to-white'
                      : isFinalized
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-stone-200 hover:border-blue-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: ID + Step # + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
                          {row.id}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">
                          Step {row.stepNumber}
                        </span>
                      </div>
                      {(() => {
                        const statusInfo = getWaterfallStatusInfo(row.status);
                        return (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Step Title & Rationale */}
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">
                        {row.stepTitle && row.stepTitle !== row.businessRequirements
                          ? row.stepTitle
                          : row.rationale || `Step ${row.stepNumber}`}
                      </h4>
                      {row.rationale && row.stepTitle && row.stepTitle !== row.rationale && row.stepTitle !== row.businessRequirements && (
                        <p className="text-xs text-stone-600 line-clamp-2 mt-1">{row.rationale}</p>
                      )}
                    </div>

                    {/* Dataset Location */}
                    <div className="text-[11px] font-mono text-stone-600 bg-stone-50 px-2 py-1 rounded border border-stone-200">
                      {vals.datasetLocation || 'No dataset selected'}
                    </div>

                    {/* Counts Summary */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-rose-50 p-1.5 rounded border border-rose-100">
                        <span className="text-[10px] text-rose-700 block">Excludes</span>
                        <span className="font-mono font-bold text-rose-900">
                          {vals.excludeCount ? vals.excludeCount.toLocaleString() : '0'}
                        </span>
                      </div>
                      <div className="bg-emerald-50 p-1.5 rounded border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 block">Includes</span>
                        <span className="font-mono font-bold text-emerald-900">
                          {vals.includeCaseCount ? vals.includeCaseCount.toLocaleString() : '0'}
                        </span>
                      </div>
                      <div className="bg-blue-50 p-1.5 rounded border border-blue-100">
                        <span className="text-[10px] text-blue-700 block">Uniques</span>
                        <span className="font-mono font-bold text-blue-900">
                          {vals.includeUniqueAccountCount ? vals.includeUniqueAccountCount.toLocaleString() : '0'}
                        </span>
                      </div>
                    </div>

                    {/* Optional Notes */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`card-notes-${row.id}`}
                          className="text-[10px] font-bold text-stone-500 uppercase tracking-wider"
                        >
                          Optional Notes
                        </label>
                        <span className="text-[10px] text-stone-400">Optional / NA</span>
                      </div>
                      <textarea
                        rows={2}
                        id={`card-notes-${row.id}`}
                        value={vals.notes}
                        onChange={(e) => handleFieldChange(row, 'notes', e.target.value)}
                        onBlur={(e) => handleNotesBlur(row, e.target.value)}
                        placeholder="State any edge case assumptions, sampling notes, or NA..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg outline-hidden font-normal resize-y text-stone-800 bg-white border border-stone-300 focus:ring-2 focus:ring-stone-900 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Primary Card Action: Start Analytics or Save/Finalize */}
                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    {!isRowStarted ? (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleStartAnalytics(row)}
                          disabled={isAnalyzing}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md cursor-pointer transition-all ring-2 ring-blue-400/50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isAnalyzing ? 'Starting & Alerting...' : 'Start Analytics'}</span>
                        </button>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-blue-800 font-semibold">
                          <Mail className="w-3 h-3 text-blue-600" />
                          <span>Automatically alerts PM, Analyst, and FRC Owner</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveRow(row)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border ${
                            isSaved
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-300'
                          }`}
                        >
                          <Save className="w-3 h-3" />
                          <span>{isSaved ? 'Saved' : 'Draft'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFinalizeAndSubmitRow(row)}
                          disabled={isFinalized}
                          className="flex-1 py-1.5 px-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs flex items-center justify-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isFinalized ? 'Submitted' : 'Finalise'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

          {/* ========================================================================= */}
          {/* TIMELINE JOURNEY TRENDLINE & DISPUTE RESOLUTION METRICS CARDS (Placed down the WF steps for primary visibility) */}
          {/* ========================================================================= */}
          <div className="pt-6 border-t border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900">Analytics Timeline &amp; Dispute Governance</h4>
                <p className="text-xs text-stone-500">Timeline trajectory from first finalized step to latest step, and rerun dispute tracking</p>
              </div>
            </div>

            {/* Analytics Timeline Journey Trendline */}
            <TimelineTrendline mode="analytics" rows={rows} />

            {/* Analytics Rerun & Requirement Finalization Dispute Cards */}
            <DisputeResolutionCards
              rows={rows}
              auditLogs={auditLogs}
              userRole="analyst"
              onOpenAuditLogs={() => {
                if (onOpenAuditLogs) onOpenAuditLogs();
              }}
              onFilterStepInLogs={(stepId) => {
                setSelectedLogStepFilter(stepId);
                if (onOpenAuditLogs) onOpenAuditLogs();
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPLETE ANALYTICS (Aggregate Summary, KPIs & Deliverable Rollup) */}
      {/* ========================================================================= */}
      {activeTab === 'complete' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Executive Quantitative KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs text-stone-500 font-semibold block">Total Excluded Cases</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-rose-600">
                  {totalExcluded.toLocaleString()}
                </span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Sum of all excluded records</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs text-stone-500 font-semibold block">Total Unique Accounts</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-stone-900">
                  {rows[rows.length - 1]?.includeUniqueAccountCount?.toLocaleString() ||
                    totalAccounts.toLocaleString()}
                </span>
                <Users className="w-4 h-4 text-stone-400" />
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Distinct client entities</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs text-stone-500 font-semibold block">Total Days Needed</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-blue-600">
                  {totalDays} Days
                </span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Cumulative timeline estimate</span>
            </div>
          </div>

          {/* Sequential Funnel Deduction Visual */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Population Funnel &amp; Waterfall Progression
                </h3>
                <p className="text-xs text-stone-500">
                  Sequential deduction from initial core population down to verified review pool
                </p>
              </div>
              <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                {completedSteps.length} of {rows.length} steps finalized
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {rows.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200">
                  <Database className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-700">Awaiting Waterfall Scoping Steps</p>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    The population deduction funnel will calculate and visualize the retention waterfall once requirements are defined by the FRC Owner.
                  </p>
                </div>
              ) : (
                rows.map((r) => {
                  const maxVal = rows[0]?.includeCaseCount || 1450000;
                  const pct = Math.min(
                    100,
                    Math.max(2, Math.round((r.includeCaseCount / maxVal) * 100))
                  );

                  return (
                    <div key={r.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold bg-stone-100 text-stone-700 px-1.5 rounded">
                            {r.id}
                          </span>
                          <span className="font-semibold text-stone-800">{r.stepTitle}</span>
                          {(r.status === 'step_finalized' || r.status === 'signed_off') && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                        <div className="font-mono text-xs flex items-center gap-3">
                          {r.excludeCount > 0 && (
                            <span className="text-rose-600 font-medium">
                              -{r.excludeCount.toLocaleString()}
                            </span>
                          )}
                          <span className="font-bold text-stone-900">
                            {r.includeCaseCount.toLocaleString()} cases ({r.workingDays}d)
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            r.category === 'Starting Population' || r.category === 'Base Population'
                              ? 'bg-blue-600'
                              : r.category === 'Exclude' || r.category === 'Exclusion'
                              ? 'bg-rose-500'
                              : r.category === 'Flag accounts/cases'
                              ? 'bg-amber-500'
                              : r.category === 'Inclusion'
                              ? 'bg-emerald-500'
                              : 'bg-purple-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Master Finalized Register Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Finalized Waterfall Requirements Register
                </h3>
                <p className="text-xs text-stone-500">
                  Consolidated specifications with Project Team email trigger statuses
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportWaterfallToExcel(rows, 'eGRC_Complete_Analytics.xlsx', projectDetails, waterfalls)}
                  className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 flex items-center gap-1.5 transition-colors"
                  title="Export all waterfalls in one Excel file with separate sheets"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAuditLogs) {
                      onOpenAuditLogs();
                    } else {
                      onTabChange('dispute_logs');
                    }
                  }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="View real-time activity and change audit logs with timestamps"
                >
                  <History className="w-3.5 h-3.5 text-stone-600" />
                  Logs
                  {auditLogs && auditLogs.length > 0 && (
                    <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {auditLogs.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">WFID#</th>
                    <th className="py-2.5 px-3">Step Rationale</th>
                    <th className="py-2.5 px-3">Business Requirements</th>
                    <th className="py-2.5 px-3">Dataset Location</th>
                    <th className="py-2.5 px-3 text-right">Exclude Count</th>
                    <th className="py-2.5 px-3 text-right">Include Cases</th>
                    <th className="py-2.5 px-3 text-right">Unique Accts</th>
                    <th className="py-2.5 px-3 text-center">Days</th>
                    <th className="py-2.5 px-3">Optional Notes</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-stone-500">
                        No finalized waterfall steps recorded yet.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => {
                    const isTriggered =
                      dispatchedRows[r.id] ||
                      Boolean(r.emailTriggeredAt) ||
                      Boolean(r.analyticsCompletedAt);

                    return (
                      <tr key={r.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{r.id}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-stone-700">{r.rationale}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-stone-800 font-medium">
                          {r.businessRequirements || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600 truncate max-w-[180px]">
                          {r.datasetLocation || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                          {r.excludeCount > 0 ? r.excludeCount.toLocaleString() : '0'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                          {r.includeCaseCount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-800">
                          {r.includeUniqueAccountCount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">
                          {r.workingDays}d
                        </td>
                        <td className="py-2.5 px-3 min-w-[180px]">
                          <textarea
                            rows={1}
                            id={`tab2-notes-${r.id}`}
                            value={getEffectiveValues(r).notes}
                            onChange={(e) => handleFieldChange(r, 'notes', e.target.value)}
                            onBlur={(e) => handleNotesBlur(r, e.target.value)}
                            placeholder="Optional notes or NA..."
                            className="w-full px-2 py-1 text-xs text-stone-800 bg-white border border-stone-200 hover:border-stone-300 focus:border-stone-500 rounded-md focus:ring-1 focus:ring-stone-900 outline-hidden resize-y font-normal"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {(() => {
                            const statusInfo = getWaterfallStatusInfo(r.status);
                            return (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}
                              >
                                {statusInfo.label}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FINALISE AND SUBMIT STEP (Analyst Formal Submission to PMO & FRC)   */}
      {/* ========================================================================= */}
      {activeTab === 'finalize' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Overview & Quick Submission Guidance */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Analyst Sign-Off Gate
                  </span>
                  <span className="text-xs font-semibold text-indigo-950">
                    Handover to Marcus Vance (PMO Lead) &amp; Sarah Jenkins (FRC Owner)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-900 mt-1">
                  Finalise and Submit Step Queue
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Confirm quantitative calculations, add formal submission remarks, and submit finalized steps to the Project Team for executive review.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-batch-finalize-all"
                  onClick={handleBatchFinalizeAll}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Finalise &amp; Submit All Steps ({rows.length})
                </button>
              </div>
            </div>

            {/* Quick Status Pill Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-indigo-200/80 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-100">
                <span className="text-stone-500 text-[11px] block">Total Steps In-Scope</span>
                <span className="text-lg font-bold font-mono text-stone-900">{rows.length}</span>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-100">
                <span className="text-stone-500 text-[11px] block">Analytics Done</span>
                <span className="text-lg font-bold font-mono text-blue-700">{emailDispatchedCount}</span>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-100">
                <span className="text-stone-500 text-[11px] block">Finalised &amp; Submitted</span>
                <span className="text-lg font-bold font-mono text-indigo-700">{finalizedCount}</span>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-100">
                <span className="text-stone-500 text-[11px] block">Finalized Requirements</span>
                <span className="text-lg font-bold font-mono text-emerald-700">
                  {rows.filter((r) => r.status === 'step_finalized' || r.status === 'signed_off').length}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-medium">Filter Queue:</span>
              <button
                type="button"
                onClick={() => setFinalizeFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  finalizeFilter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Steps ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setFinalizeFilter('ready')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  finalizeFilter === 'ready'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Ready to Submit ({readyToFinalizeCount})
              </button>
              <button
                type="button"
                onClick={() => setFinalizeFilter('submitted')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  finalizeFilter === 'submitted'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Submitted / Finalized ({finalizedCount})
              </button>
            </div>
          </div>

          {/* Step-by-Step Submission Cards */}
          <div className="space-y-4">
            {rows.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200">
                <CheckCircle2 className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-700">No Waterfall Steps in Submission Queue</p>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Once the FRC Owner formulates and finalises requirements, they will appear here for analyst execution and sign-off submission.
                </p>
              </div>
            ) : (
              rows
                .filter((row) => {
                  const isFinalized =
                    finalizedRows[row.id] ||
                    row.status === 'ready_for_review' ||
                    row.status === 'signed_off';
                  if (finalizeFilter === 'ready') return !isFinalized;
                  if (finalizeFilter === 'submitted') return isFinalized;
                  return true;
                })
                .map((row) => {
                const vals = getEffectiveValues(row);
                const isFinalized =
                  finalizedRows[row.id] ||
                  row.status === 'ready_for_review' ||
                  row.status === 'signed_off';
                const isSignedOff = row.status === 'signed_off';
                const isJustSaved = finalizedSuccessRowId === row.id;

                return (
                  <div
                    key={row.id}
                    id={`finalize-card-${row.id}`}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-xs space-y-4 ${
                      isSignedOff
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : isFinalized
                        ? 'border-indigo-200 bg-indigo-50/10'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold bg-stone-900 text-white px-2.5 py-1 rounded-lg shadow-2xs">
                          {row.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-stone-900">{row.stepTitle}</h4>
                            <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                              {row.category}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                              Ref: {row.ruleReference}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">{row.rationale}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(() => {
                          const statusInfo = getWaterfallStatusInfo(row.status);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-2xs ${statusInfo.badgeClass}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                              {statusInfo.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Step Metrics & Verification Checklist */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Exclude Cases</span>
                        <span className="font-mono font-bold text-rose-600 text-sm">
                          {vals.excludeCount > 0 ? `-${vals.excludeCount.toLocaleString()}` : '0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">In-Scope Cases</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">
                          {vals.includeCaseCount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Unique Accounts</span>
                        <span className="font-mono font-bold text-blue-900 text-sm">
                          {vals.includeUniqueAccountCount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-medium block">Schedule Effort</span>
                        <span className="font-mono font-bold text-stone-800 text-sm">
                          {vals.workingDays} Days ({vals.startDate || 'TBD'} - {vals.endDate || 'TBD'})
                        </span>
                      </div>
                    </div>

                    {/* Business Requirements & Dataset Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          Business Requirements Logic
                        </span>
                        <p className="text-stone-800 leading-relaxed">
                          {vals.businessRequirements || 'No specific requirement text entered.'}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          Drive Parity Dataset Path
                        </span>
                        <code className="text-[11px] font-mono text-stone-800 bg-stone-50 p-1.5 rounded border border-stone-200 block truncate">
                          {vals.datasetLocation}
                        </code>
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 pt-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Validated against partition schema
                        </span>
                      </div>
                    </div>

                    {/* Analyst Submission Remarks */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-700">
                        Analyst Submission Notes &amp; Assumptions for Project Manager &amp; FRC:
                      </label>
                      <textarea
                        rows={2}
                        value={stepCustomSubmissionNotes[row.id] ?? vals.notes}
                        onChange={(e) =>
                          setStepCustomSubmissionNotes((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                        placeholder="State any edge case assumptions, sampling variances, or PM sprint notes..."
                        className="w-full px-3 py-2 text-xs text-stone-800 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 outline-hidden font-normal"
                      />
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
                      <div className="text-[11px] text-stone-500 flex items-center gap-3">
                        <span>Assigned Analyst: <strong>Alex Morgan</strong></span>
                        <span>•</span>
                        <span>Project Manager: <strong>Marcus Vance</strong></span>
                        <span>•</span>
                        <span>FRC Owner: <strong>Sarah Jenkins</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onTabChange('start');
                            const el = document.getElementById(`row-${row.id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 font-semibold rounded-lg transition-colors"
                        >
                          Edit in Start Analytics
                        </button>

                        {/* Optional: Save as Draft */}
                        <button
                          type="button"
                          id={`btn-tab3-save-draft-${row.id}`}
                          onClick={() => handleSaveRow(row)}
                          className="px-3 py-2 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 font-semibold rounded-xl border border-stone-300 flex items-center gap-1.5 transition-colors"
                          title="Optional: Save draft so work can be continued for as long as needed"
                        >
                          <Save className="w-3.5 h-3.5 text-stone-600" />
                          <span>{saveSuccessRowId === row.id ? 'Draft Saved!' : 'Save as Draft'}</span>
                        </button>

                        <button
                          type="button"
                          id={`btn-submit-step-${row.id}`}
                          onClick={() =>
                            handleFinalizeAndSubmitRow(
                              row,
                              stepCustomSubmissionNotes[row.id]
                            )
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
                            isJustSaved
                              ? 'bg-emerald-600 text-white'
                              : isFinalized
                              ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                              : 'bg-stone-900 hover:bg-stone-800 text-white'
                          }`}
                        >
                          {isJustSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Finalised &amp; Dispatched!
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              {isFinalized ? 'Re-Submit Step' : 'Finalise and Submit Step'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DISPUTE & COLLABORATIVE AUDIT LOG VIEW (Excel Replacement) */}
      {/* ========================================================================= */}
      {activeTab === 'dispute_logs' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <DisputeAuditLogView
            logs={auditLogs}
            rows={rows}
            currentRole="analyst"
            initialStepFilter={selectedLogStepFilter}
            onBackToTable={() => onTabChange('table')}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* EMAIL TRIGGER NOTIFICATION MODAL (Project Team: Analyst & Project Manager) */}
      {/* ========================================================================= */}
      {activeEmailRow && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Project Team Email Notification Trigger
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">
                      WFID# {activeEmailRow.id}
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-300">
                    Automated notification trigger generated upon completion of Start Analytics
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveEmailRow(null)}
                className="text-stone-400 hover:text-white p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Recipient Roster */}
              <div className="bg-stone-50 rounded-xl border border-stone-200 p-3.5 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-stone-700 w-24 shrink-0">TO (Project Team):</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-md font-semibold border border-blue-200">
                      marcus.vance.pmo@enterprise.bank (Project Manager)
                    </span>
                    <span className="bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-md font-semibold border border-blue-200">
                      alex.morgan@enterprise.bank (Lead Analyst)
                    </span>
                    <span className="bg-stone-200 text-stone-800 font-mono px-2 py-0.5 rounded-md">
                      waterfall.team@enterprise.bank
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1.5 border-t border-stone-200">
                  <span className="font-bold text-stone-700 w-24 shrink-0">CC:</span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="bg-purple-100 text-purple-800 font-mono px-2 py-0.5 rounded-md font-semibold border border-purple-200">
                      sarah.jenkins@enterprise.bank (FRC Owner)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1.5 border-t border-stone-200">
                  <span className="font-bold text-stone-700 w-24 shrink-0">Add Recipient:</span>
                  <input
                    type="email"
                    placeholder="e.g. qa.lead@enterprise.bank"
                    value={customRecipient}
                    onChange={(e) => setCustomRecipient(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Subject</label>
                <div className="bg-stone-100 px-3 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-800 font-mono">
                  {buildEmailData(activeEmailRow).subject}
                </div>
              </div>

              {/* Email Content Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">Pre-compiled Email Body</label>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(activeEmailRow)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Body Text
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-stone-950 text-stone-200 p-4 rounded-xl border border-stone-800 font-mono text-[11px] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {buildEmailData(activeEmailRow).bodyText}
                </div>
              </div>

              {/* Status Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Audit Finalized Email Trigger</strong>
                  <span>
                    This notification has been registered in the Governance Audit Log and dispatched to the internal enterprise SMTP relay queue for Project Manager &amp; Analyst delivery.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-stone-50 px-5 py-3.5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-stone-400" />
                <span>eGRC Automated Dispatch Service • TLS 1.3 Encrypted</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleOpenMailto(activeEmailRow)}
                  className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 transition-colors shadow-2xs w-1/2 sm:w-auto"
                  title="Open draft in system email client (Outlook, Gmail)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                  Open in Mail Client
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDispatchedRows((prev) => ({ ...prev, [activeEmailRow.id]: true }));
                    setActiveEmailRow(null);
                  }}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs w-1/2 sm:w-auto"
                >
                  <Send className="w-3.5 h-3.5 text-stone-200" />
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
