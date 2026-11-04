import React, { useState } from 'react';
import {
  Plus,
  Send,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Download,
  Edit3,
  Check,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  User,
  Filter,
  Mail,
  FileCheck2,
  AlertCircle,
  X,
  Copy,
  ExternalLink,
  TrendingUp,
  History,
  Layers,
  Scale,
  Trash2,
  Lock,
  Paperclip,
} from 'lucide-react';
import {
  WaterfallRow,
  WaterfallStepVersion,
  AuditLogEntry,
  ProjectDetails,
  WaterfallEntity,
  StepAttachment,
} from '../types';
import { exportWaterfallToExcel } from '../utils/exportUtils';
import { formatDateDisplay } from '../utils/workingDays';
import { getWaterfallStatusInfo } from '../utils/statusUtils';
import { readFileAsAttachment, formatFileSize } from '../utils/attachmentUtils';
import { TimelineTrendline } from './TimelineTrendline';
import { DisputeAuditLogView } from './DisputeAuditLogView';
import { ProjectDetailsCard } from './ProjectDetailsCard';
import { StepAttachmentsManager } from './StepAttachmentsManager';

interface FRCWorkspaceProps {
  rows: WaterfallRow[];
  auditLogs?: AuditLogEntry[];
  projectDetails: ProjectDetails;
  waterfalls?: WaterfallEntity[];
  activeWaterfallId?: string;
  onSelectWaterfall?: (waterfallId: string) => void;
  onOpenAddWaterfall?: () => void;
  onOpenCreateProject?: () => void;
  onOpenAuditLogs?: () => void;
  onResetToCleanSlate?: () => void;
  onSaveProjectDetails: (updated: ProjectDetails) => void;
  onAddRow: (row: Omit<WaterfallRow, 'id' | 'stepNumber' | 'versions' | 'lastUpdated'>) => void;
  onUpdateRow: (rowId: string, updates: Partial<WaterfallRow>, changeSummary?: string) => void;
  onSubmitToAnalyst: (rowId: string) => void;
  onSignOffRow: (rowId: string) => void;
  onSelectVersionStep?: (rowId: string) => void;
  onDeleteRow?: (rowId: string) => void;
  onAddAttachmentsToStep?: (stepId: string, newAttachments: StepAttachment[]) => void;
  onRemoveAttachmentFromStep?: (stepId: string, attachmentId: string) => void;
  onFinalizeRequirement?: (
    rowId: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => void;
  onStartModification?: (
    rowId: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => void;
  onSubmitModifiedRequirement?: (
    rowId: string,
    updates: Partial<WaterfallRow>,
    changeSummary: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => void;
  isReadOnly?: boolean;
  onTriggerEmailNotification?: (
    rowId: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => void;
}

export const FRCWorkspace: React.FC<FRCWorkspaceProps> = ({
  rows,
  auditLogs = [],
  projectDetails,
  waterfalls,
  activeWaterfallId,
  onSelectWaterfall,
  onOpenAddWaterfall,
  onOpenCreateProject,
  onOpenAuditLogs,
  onResetToCleanSlate,
  onSaveProjectDetails,
  onAddRow,
  onUpdateRow,
  onSubmitToAnalyst,
  onSignOffRow,
  onSelectVersionStep,
  onDeleteRow,
  onAddAttachmentsToStep,
  onRemoveAttachmentFromStep,
  onFinalizeRequirement,
  onStartModification,
  onSubmitModifiedRequirement,
  onTriggerEmailNotification,
  isReadOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'scoping' | 'dispute_logs'>('scoping');
  const [selectedLogStepFilter, setSelectedLogStepFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRow, setEditingRow] = useState<WaterfallRow | null>(null);
  const [rowToDelete, setRowToDelete] = useState<WaterfallRow | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New Step Form State
  const [newCategory, setNewCategory] = useState<'Flag accounts/cases' | 'Exclude' | 'Starting Population'>('Exclude');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [newBusinessRequirements, setNewBusinessRequirements] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [draftAttachments, setDraftAttachments] = useState<StepAttachment[]>([]);

  // Edit / Modify Requirement Form State
  const [editRationaleText, setEditRationaleText] = useState('');
  const [editChangeSummary, setEditChangeSummary] = useState('');
  const [editRuleRef, setEditRuleRef] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Email Preview Modal State
  const [activeEmailData, setActiveEmailData] = useState<{
    subject: string;
    body: string;
    recipients: string[];
    cc: string[];
    type: 'finalize' | 'modify_start' | 'modify_submit';
    stepId: string;
    stepTitle: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Toast Notification State
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    description: string;
    type: 'finalize' | 'modification' | 'info';
    rowId?: string;
  } | null>(null);

  // Change Requirement Confirmation Modal State (Pausing Analytics Prompt)
  const [changeRequirementConfirmRow, setChangeRequirementConfirmRow] = useState<WaterfallRow | null>(null);

  const handleChangeRequirementClick = (row: WaterfallRow) => {
    setChangeRequirementConfirmRow(row);
  };

  const handleConfirmChangeRequirement = () => {
    if (!changeRequirementConfirmRow) return;
    const target = changeRequirementConfirmRow;
    setChangeRequirementConfirmRow(null);
    handleStartModificationClick(target);
  };

  // Handle Confirmed Deletion of a Waterfall Step
  const handleConfirmDelete = () => {
    if (!rowToDelete) return;
    const id = rowToDelete.id;
    const title = rowToDelete.stepTitle;
    if (onDeleteRow) {
      onDeleteRow(id);
    }
    setToastNotification({
      type: 'info',
      title: `Step WFID# ${id} Deleted`,
      description: `Step "${title}" was completely removed from the waterfall scope. Deletion recorded in collaborative audit log.`,
      rowId: id,
    });
    setRowToDelete(null);
  };

  // Helper to build stakeholder email data for "Finalize Requirement"
  const buildFinalizeEmailData = (row: WaterfallRow) => {
    const primaryRecipients = [
      'alex.morgan@enterprise.bank',
      'marcus.vance.pmo@enterprise.bank',
      'waterfall.team@enterprise.bank',
    ];
    const ccRecipients = ['sarah.jenkins@enterprise.bank'];
    const subject = `[Waterfall Requirement Finalized] Step WFID# ${row.id} Finalized: ${row.stepTitle}`;
    const body = `Dear Project Team (Analyst & Project Manager),

FRC Owner Sarah Jenkins has COMPLETED AND FINALIZED the scoping requirement for Waterfall Step WFID# ${row.id}.

==================================================
STEP SPECIFICATIONS & STATUS
==================================================
• Step ID           : WFID# ${row.id}
• Step Title        : ${row.stepTitle}
• Category          : ${row.category}
• Rule Reference    : ${row.ruleReference}
• Current Status    : STEP FINALIZED (Ready for Analytics)
• Assigned Analyst  : ${row.assignedAnalyst}
• FRC Owner         : Sarah Jenkins (FRC Director)

==================================================
BUSINESS REQUIREMENTS & RATIONALE
==================================================
${row.businessRequirements || row.rationale}

==================================================
NEXT STEPS:
==================================================
1. Lead Analyst (Alex Morgan): The requirement specification is finalized and locked. You can now click "Start Analytics Step" in the Development view to formulate exclusions and schedule.
2. Project Manager (Marcus Vance): Baseline sprint allocation ready for tracking.

Automated notification generated by Traceable Waterfall Management Portal.`;

    return {
      subject,
      body,
      recipients: primaryRecipients,
      cc: ccRecipients,
      type: 'finalize' as const,
      stepId: row.id,
      stepTitle: row.stepTitle,
    };
  };

  // Helper to build stakeholder email data for "FRC is Modifying Requirement"
  const buildModifyStartEmailData = (row: WaterfallRow) => {
    const primaryRecipients = [
      'alex.morgan@enterprise.bank',
      'marcus.vance.pmo@enterprise.bank',
      'waterfall.team@enterprise.bank',
    ];
    const ccRecipients = ['sarah.jenkins@enterprise.bank'];
    const subject = `[Waterfall Requirement Alert] FRC is Modifying Step WFID# ${row.id}: ${row.stepTitle}`;
    const body = `Dear Project Team (Analyst & Project Manager),

Please be advised that FRC Owner Sarah Jenkins has initiated a MODIFICATION of the requirement specification for Waterfall Step WFID# ${row.id} (${row.stepTitle}).

==================================================
MODIFICATION NOTICE
==================================================
• Step ID           : WFID# ${row.id}
• Step Title        : ${row.stepTitle}
• Category          : ${row.category}
• Rule Reference    : ${row.ruleReference}
• Current Status    : IN MODIFICATION
• Triggered By      : Sarah Jenkins (FRC Owner)
• Assigned Analyst  : ${row.assignedAnalyst}

==================================================
CURRENT ACTIVE RATIONALE (UNDER REVISION):
==================================================
${row.businessRequirements || row.rationale}

==================================================
ACTION REQUIRED:
==================================================
1. Analyst Alex Morgan: Note that this step is currently "In modification". Any active calculations or submissions should be held pending FRC revised submission.
2. The Development view reflects the status as "In modification".
3. Once FRC submits the modified requirement, you will receive confirmation and the status will update to "Step finalized".

Automated notification generated by Traceable Waterfall Management Portal.`;

    return {
      subject,
      body,
      recipients: primaryRecipients,
      cc: ccRecipients,
      type: 'modify_start' as const,
      stepId: row.id,
      stepTitle: row.stepTitle,
    };
  };

  // Helper to build stakeholder email data for "Modified Requirement Submitted"
  const buildModifySubmitEmailData = (
    row: WaterfallRow,
    updatedRationale: string,
    updatedRuleRef: string,
    updatedTitle: string,
    changeSummary: string
  ) => {
    const primaryRecipients = [
      'alex.morgan@enterprise.bank',
      'marcus.vance.pmo@enterprise.bank',
      'waterfall.team@enterprise.bank',
    ];
    const ccRecipients = ['sarah.jenkins@enterprise.bank'];
    const newVersionNum = row.versions.length + 1;
    const subject = `[Waterfall Requirement Finalized] Modified Step WFID# ${row.id} Finalized & Submitted: ${updatedTitle}`;
    const body = `Dear Project Team (Analyst & Project Manager),

FRC Owner Sarah Jenkins has COMPLETED AND SUBMITTED the modified requirement for Waterfall Step WFID# ${row.id}.

A new compliance version (v${newVersionNum}) has been published to the audit trail.

==================================================
UPDATED SPECIFICATIONS
==================================================
• Step ID           : WFID# ${row.id}
• Step Title        : ${updatedTitle}
• Category          : ${row.category}
• Rule Reference    : ${updatedRuleRef}
• Current Status    : STEP FINALIZED
• Version           : v${newVersionNum}
• FRC Owner         : Sarah Jenkins (FRC Director)

==================================================
UPDATED BUSINESS RATIONALE:
==================================================
${updatedRationale}

==================================================
CHANGE SUMMARY / JUSTIFICATION:
==================================================
${changeSummary}

==================================================
NEXT STEPS:
==================================================
1. Analyst Alex Morgan: The requirement modification has been submitted. Status is now "Step finalized". You may proceed with "Start Analytics Step".
2. Project Manager Marcus Vance: Schedule and version history updated.

Automated notification generated by Traceable Waterfall Management Portal.`;

    return {
      subject,
      body,
      recipients: primaryRecipients,
      cc: ccRecipients,
      type: 'modify_submit' as const,
      stepId: row.id,
      stepTitle: updatedTitle,
    };
  };

  // ACTION 1: FRC Finalizes Requirement
  const handleFinalizeRequirementClick = (row: WaterfallRow) => {
    const emailData = buildFinalizeEmailData(row);

    if (onFinalizeRequirement) {
      onFinalizeRequirement(row.id, {
        recipients: [...emailData.recipients, ...emailData.cc],
        subject: emailData.subject,
        body: emailData.body,
        stepTitle: row.stepTitle,
      });
    }

    setActiveEmailData(emailData);
    setToastNotification({
      title: `Requirement Finalized for WFID# ${row.id}`,
      description: `Email triggered to Lead Analyst Alex Morgan & PM Marcus Vance. Status updated to "Step finalized".`,
      type: 'finalize',
      rowId: row.id,
    });
  };

  // ACTION 2: FRC Starts Modifying Requirement
  const handleStartModificationClick = (row: WaterfallRow) => {
    const emailData = buildModifyStartEmailData(row);

    // Trigger email and status update to in_modification
    if (onStartModification) {
      onStartModification(row.id, {
        recipients: [...emailData.recipients, ...emailData.cc],
        subject: emailData.subject,
        body: emailData.body,
        stepTitle: row.stepTitle,
      });
    }

    // Open the modify modal
    setEditingRow(row);
    setEditTitle(row.stepTitle);
    setEditRationaleText(row.rationale);
    setEditRuleRef(row.ruleReference);
    setEditChangeSummary('');

    setToastNotification({
      title: `FRC is Modifying Step WFID# ${row.id}`,
      description: `Email alert sent to Analyst Alex Morgan & PM Marcus Vance. Status on Analyst view is now "In modification".`,
      type: 'modification',
      rowId: row.id,
    });
  };

  // ACTION 3A: FRC Commits Modification (Saves changes without finalizing)
  const handleCommitModificationOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingRow) return;

    if (!editRationaleText.trim()) {
      alert('Please enter a rationale.');
      return;
    }

    const changeSummary = editChangeSummary.trim() || 'FRC committed requirement modification.';

    if (onUpdateRow) {
      onUpdateRow(
        editingRow.id,
        {
          stepTitle: editTitle.trim(),
          rationale: editRationaleText.trim(),
          ruleReference: editRuleRef.trim(),
          status: 'in_modification',
        },
        changeSummary
      );
    }

    setToastNotification({
      title: `Modification Committed for WFID# ${editingRow.id}`,
      description: `Requirement updates saved. Status remains In Modification until you choose to finalize.`,
      type: 'modification',
      rowId: editingRow.id,
    });

    setEditingRow(null);
  };

  // ACTION 3B: FRC Commits & Finalizes Requirement
  const handleSubmitModificationAndFinalize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingRow) return;

    if (!editRationaleText.trim()) {
      alert('Please enter a rationale.');
      return;
    }

    const emailData = buildModifySubmitEmailData(
      editingRow,
      editRationaleText,
      editRuleRef,
      editTitle,
      editChangeSummary.trim() || 'FRC completed requirement modification and finalized.'
    );

    if (onSubmitModifiedRequirement) {
      onSubmitModifiedRequirement(
        editingRow.id,
        {
          stepTitle: editTitle.trim(),
          rationale: editRationaleText.trim(),
          ruleReference: editRuleRef.trim(),
        },
        editChangeSummary.trim() || 'FRC completed requirement modification and finalized.',
        {
          recipients: [...emailData.recipients, ...emailData.cc],
          subject: emailData.subject,
          body: emailData.body,
          stepTitle: editTitle.trim(),
        }
      );
    } else {
      onUpdateRow(
        editingRow.id,
        {
          stepTitle: editTitle.trim(),
          rationale: editRationaleText.trim(),
          ruleReference: editRuleRef.trim(),
          status: 'step_finalized',
        },
        editChangeSummary.trim() || 'FRC modified and finalized requirement.'
      );
    }

    setEditingRow(null);
    setActiveEmailData(emailData);
    setToastNotification({
      title: `Modified Step WFID# ${editingRow.id} Finalized`,
      description: `Stakeholders notified. Analyst view now reflects status "Step finalized" (ready for Start Analytics Step).`,
      type: 'finalize',
      rowId: editingRow.id,
    });
  };

  // Add Step Form Submission (Always saved as draft)
  const handleCreateStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRationale.trim() || !newBusinessRequirements.trim()) return;

    const autoRuleRef = `REG-${
      newCategory === 'Exclude'
        ? 'EXC'
        : newCategory === 'Starting Population'
        ? 'POP'
        : 'FLG'
    }-${String(rows.length + 1).padStart(2, '0')}`;

    const derivedTitle =
      newStepTitle.trim() ||
      (newRationale.trim().length > 65
        ? `${newRationale.trim().slice(0, 62)}...`
        : newRationale.trim() ||
          `Step ${rows.length + 1} (${newCategory})`);

    onAddRow({
      stepTitle: derivedTitle,
      category: newCategory,
      ruleReference: autoRuleRef,
      rationale: newRationale.trim(),
      businessRequirements: newBusinessRequirements.trim(),
      status: 'draft',
      excludeCount: 0,
      includeCaseCount: 0,
      includeUniqueAccountCount: 0,
      startDate: '',
      endDate: '',
      workingDays: 0,
      assignedAnalyst: 'Alex Morgan (Lead Analyst)',
      frcOwner: 'Sarah Jenkins (FRC Director)',
      notes: newNotes.trim() ? newNotes.trim() : 'NA',
      attachments: draftAttachments,
    });

    // Reset Form
    setNewCategory('Exclude');
    setNewStepTitle('');
    setNewRationale('');
    setNewBusinessRequirements('');
    setNewNotes('');
    setDraftAttachments([]);
    setShowAddModal(false);

    setToastNotification({
      title: 'Requirement Drafted',
      description:
        'New waterfall scoping step saved as draft. Review with "Modify requirement" or click "Finalise requirement" when ready.',
      type: 'info',
    });
  };

  const isAnalyticsStepCompleted = (r: WaterfallRow) =>
    r.status === 'ready_for_review' || r.status === 'submitted';

  const isAnalyticsInProgress = (r: WaterfallRow) =>
    !isAnalyticsStepCompleted(r) &&
    r.status !== 'draft' &&
    r.status !== 'in_modification' &&
    r.status !== 'step_finalized' &&
    r.status !== 'signed_off' &&
    (r.status === 'in_analysis' || Boolean(r.emailTriggeredAt));

  const filteredRows = rows.filter((r) => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'draft' && r.status !== 'draft') return false;
      if (filterStatus === 'step_finalized' && r.status !== 'step_finalized' && r.status !== 'signed_off') return false;
      if (filterStatus === 'in_modification' && r.status !== 'in_modification') return false;
      if (filterStatus === 'in_progress' && !isAnalyticsInProgress(r)) return false;
      if (filterStatus === 'analytics_completed' && !isAnalyticsStepCompleted(r)) return false;
    }
    return true;
  });

  const draftCount = rows.filter((r) => r.status === 'draft').length;
  const inModificationCount = rows.filter((r) => r.status === 'in_modification').length;
  const stepFinalizedCount = rows.filter((r) => r.status === 'step_finalized' || r.status === 'signed_off').length;
  const inProgressCount = rows.filter((r) => isAnalyticsInProgress(r)).length;
  const analyticsCompletedCount = rows.filter((r) => isAnalyticsStepCompleted(r)).length;

  const handleCopyEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleOpenMailto = (emailData: {
    recipients: string[];
    cc: string[];
    subject: string;
    body: string;
  }) => {
    const to = emailData.recipients.join(',');
    const cc = emailData.cc.join(',');
    const subject = encodeURIComponent(emailData.subject);
    const body = encodeURIComponent(emailData.body);
    window.open(`mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div id="frc-workspace" className="space-y-6 animate-in fade-in duration-200">
      {/* View-Only Mode Banner */}
      {isReadOnly && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                View-Only Mode: Edit Access Restricted
              </p>
              <p className="text-amber-800 text-xs">
                This project is assigned to <strong className="font-semibold text-stone-900">{projectDetails.assignedToName || projectDetails.assignedToEmail || projectDetails.frcName}</strong>. Only the designated assignee has permissions to draft steps, modify rationales, finalize requirements, or sign off.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-xl shrink-0 border border-amber-200">
            Read-Only
          </span>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastNotification && (
        <div
          className={`p-4 rounded-xl border shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200 ${
            toastNotification.type === 'modification'
              ? 'bg-amber-900 text-amber-50 border-amber-700'
              : 'bg-stone-900 text-white border-stone-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                toastNotification.type === 'modification'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">{toastNotification.title}</p>
              <p className="text-[11px] text-stone-300">{toastNotification.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="p-1 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FRC WORKSPACE TABS: SCOPING VS DISPUTE RESOLUTION AUDIT LOGS */}
      {/* ========================================================================= */}
      <div className="flex border-b border-stone-200 mt-5 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          id="tab-frc-scoping"
          onClick={() => setActiveTab('scoping')}
          className={`py-3 px-5 border-b-2 transition-all flex items-center gap-2 text-sm whitespace-nowrap ${
            activeTab === 'scoping'
              ? 'border-stone-900 text-stone-900 font-bold bg-stone-50/70'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === 'scoping' ? 'text-blue-600' : 'text-stone-400'}`} />
          Waterfall Requirements &amp; Scoping
          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono font-bold">
            {rows.length} Steps
          </span>
        </button>
      </div>

      {/* TAB CONTENT: DISPUTE & AUDIT LOG VIEW */}
      {activeTab === 'dispute_logs' && (
        <div className="mt-4 animate-in fade-in duration-150">
          <DisputeAuditLogView
            logs={auditLogs}
            rows={rows}
            currentRole="frc"
            initialStepFilter={selectedLogStepFilter}
            onBackToTable={() => setActiveTab('scoping')}
          />
        </div>
      )}

      {/* TAB CONTENT: WATERFALL REQUIREMENTS & SCOPING */}
      {activeTab === 'scoping' && (
        <div className="space-y-4 mt-4 animate-in fade-in duration-150">
          {/* Permanent Project Details Specification & Enter Project Details Button */}
          <ProjectDetailsCard
            projectDetails={projectDetails}
            userRole="frc"
            onSaveProjectDetails={onSaveProjectDetails}
            waterfalls={waterfalls}
            activeWaterfallId={activeWaterfallId}
            onSelectWaterfall={onSelectWaterfall}
            onOpenAddWaterfall={onOpenAddWaterfall}
            onOpenCreateProject={onOpenCreateProject}
            onResetToCleanSlate={onResetToCleanSlate}
            isReadOnly={isReadOnly}
          />

          {/* Filter and Table Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-stone-400 ml-1" />
              <span className="text-xs text-stone-500 font-semibold">Filter Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 focus:ring-1 focus:ring-stone-900"
              >
                <option value="all">All Categories</option>
                <option value="Exclude">Exclude</option>
                <option value="Flag accounts/cases">Flag accounts/cases</option>
                <option value="Starting Population">Starting Population</option>
                <option value="Base Population">Base Population</option>
                <option value="Exclusion">Exclusion</option>
                <option value="Inclusion">Inclusion</option>
                <option value="Sampling">Sampling</option>
                <option value="Regulatory">Regulatory</option>
              </select>

              <span className="text-xs text-stone-500 font-semibold ml-2">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 focus:ring-1 focus:ring-stone-900"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Requirement in Draft</option>
                <option value="in_modification">In Modification</option>
                <option value="step_finalized">Requirement Finalized</option>
                <option value="in_progress">Analytics in Progress</option>
                <option value="analytics_completed">Analytics Step Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-export-waterfall-frc-cards"
                onClick={() => {
                  const syncedWaterfalls = (waterfalls || []).map((wf) =>
                    wf.id === activeWaterfallId ? { ...wf, rows } : wf
                  );
                  exportWaterfallToExcel(rows, 'Waterfall_Rows.xlsx', projectDetails, syncedWaterfalls);
                }}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 transition-colors shadow-2xs"
                title="Download formatted Excel workbook with all project waterfalls in separate sheets (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Waterfall
              </button>

              <button
                type="button"
                id="btn-open-logs-frc"
                onClick={() => {
                  if (onOpenAuditLogs) {
                    onOpenAuditLogs();
                  } else {
                    setActiveTab('dispute_logs');
                  }
                }}
                className="text-xs font-semibold text-stone-800 hover:text-stone-900 flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg border border-stone-300 transition-colors shadow-2xs"
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

      {/* Row Cards List */}
      <div className="space-y-4">
        {rows.length === 0 && (
          <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center shadow-xs space-y-2">
            <p className="text-xs font-semibold text-stone-700">No Waterfall Steps Formulated</p>
            {isReadOnly ? (
              <p className="text-xs text-stone-400">
                Step formulation is restricted to the assigned project owner ({projectDetails.assignedToName || projectDetails.assignedToEmail || projectDetails.frcName}).
              </p>
            ) : (
              <button
                type="button"
                id="btn-frc-first-step"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Waterfall Step (Step 1)
              </button>
            )}
          </div>
        )}
        {filteredRows.map((row) => {
          const isSignedOff = row.status === 'signed_off';
          const isSubmittedByAnalyst = isAnalyticsStepCompleted(row);
          const isInModification = row.status === 'in_modification';
          const isStepFinalized = row.status === 'step_finalized';
          const isInProgress =
            !isSignedOff &&
            !isSubmittedByAnalyst &&
            !isInModification &&
            !isStepFinalized &&
            isAnalyticsInProgress(row);
          const isDraft = row.status === 'draft';

          return (
            <div
              key={row.id}
              id={`frc-row-${row.id}`}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:border-stone-400 ${
                isSignedOff
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : isSubmittedByAnalyst
                  ? 'border-emerald-300 bg-emerald-50/15'
                  : isInModification
                  ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                  : isStepFinalized
                  ? 'border-indigo-200 bg-indigo-50/10'
                  : isInProgress
                  ? 'border-blue-200 bg-blue-50/5'
                  : 'border-stone-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left: Step Details & Rationale */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {row.stepNumber}
                    </span>
                    <span className="font-mono text-xs font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                      {row.id}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        row.category === 'Exclude' || row.category === 'Exclusion'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : row.category === 'Starting Population' || row.category === 'Base Population'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : row.category === 'Flag accounts/cases' || row.category === 'Sampling'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {row.category}
                    </span>
                    <span className="font-mono text-[11px] bg-stone-50 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                      {row.ruleReference}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      v{row.versions.length}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-stone-900 leading-snug">{row.stepTitle}</h3>
                    {!isReadOnly && (
                      <button
                        type="button"
                        id={`btn-delete-step-${row.id}`}
                        onClick={() => setRowToDelete(row)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
                        title="Delete this waterfall step completely"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Delete Step
                      </button>
                    )}
                  </div>

                  {/* Business Requirements Box (if present) */}
                  {row.businessRequirements && (
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs text-stone-800 leading-relaxed">
                      <span className="font-semibold text-blue-900 block mb-1">FRC Business Requirements:</span>
                      {row.businessRequirements}
                    </div>
                  )}

                  {/* Business Rationale Box */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed">
                    <span className="font-semibold text-stone-600 block mb-1">Step Rationale:</span>
                    {row.rationale}
                  </div>

                  {/* Dynamic Workflow Alerts / Notes */}
                  {isStepFinalized && (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>
                          <strong>Step Finalized:</strong> Requirement scoping finalized by FRC. Email triggered to stakeholders. Analyst view is ready for <em>Start Analytics Step</em>.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveEmailData(buildFinalizeEmailData(row))}
                        className="text-[11px] font-bold text-indigo-800 underline hover:text-indigo-950 shrink-0"
                      >
                        View Finalize Email
                      </button>
                    </div>
                  )}

                  {row.notes !== undefined && (
                    <div className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200/70 flex items-start gap-1.5">
                      <span className="font-semibold text-stone-700 shrink-0">Notes:</span>
                      <span className={row.notes && row.notes.trim() !== 'NA' ? 'text-stone-800' : 'text-stone-400 italic'}>
                        {row.notes?.trim() ? row.notes : 'NA'}
                      </span>
                    </div>
                  )}

                  {/* Step Attachments (PDF, Excel, Images, Word, PPT) */}
                  <div className="pt-2">
                    <StepAttachmentsManager
                      stepId={row.id}
                      stepNumber={row.stepNumber}
                      stepTitle={row.stepTitle}
                      attachments={row.attachments || []}
                      currentUserName="Sarah Jenkins"
                      currentUserRole="FRC Owner"
                      onAddAttachments={onAddAttachmentsToStep || (() => {})}
                      onRemoveAttachment={onRemoveAttachmentFromStep}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </div>

                {/* Right: Status, Counts & Action Flow */}
                <div className="lg:w-80 shrink-0 bg-stone-50/60 p-4 rounded-xl border border-stone-200 space-y-3">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-500">Status:</span>
                    {(() => {
                      const statusInfo = getWaterfallStatusInfo(row.status, 'frc');
                      return (
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border shadow-2xs ${statusInfo.badgeClass}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Quantitative Metrics Preview */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">Exclusions</span>
                      <span className="font-mono font-bold text-stone-800">
                        {row.excludeCount > 0 ? `-${row.excludeCount.toLocaleString()}` : '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">Included Cases</span>
                      <span className="font-mono font-bold text-stone-800">
                        {row.includeCaseCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-500 flex items-center justify-end pt-1 border-t border-stone-200">
                    <span>{row.workingDays > 0 ? `${row.workingDays} working days` : 'Schedule TBD'}</span>
                  </div>

                  {/* FRC Action Controls */}
                  <div className="pt-2 flex flex-col gap-2">
                    {isReadOnly ? (
                      <div className="py-2 px-3 bg-stone-100 text-stone-500 text-xs rounded-xl text-center font-medium border border-stone-200">
                        View-Only: Step editing restricted to project assignee
                      </div>
                    ) : (
                      <>
                        {/* PRIMARY ACTION BUTTONS */}

                        {/* 1. When Draft: Provide "Modify requirement" and then kept visible as last tab/button: "Finalise requirement" */}
                        {isDraft && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              id={`btn-modify-requirement-${row.id}`}
                              onClick={() => handleStartModificationClick(row)}
                              className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg border border-stone-300 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-stone-700" />
                              Modify requirement
                            </button>
                            <button
                              type="button"
                              id={`btn-finalize-requirement-${row.id}`}
                              onClick={() => handleFinalizeRequirementClick(row)}
                              className="py-2 px-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-400" />
                              Finalise requirement
                            </button>
                          </div>
                        )}

                        {/* 2. When Step Finalized: Provide "Change requirement" with confirmation prompt */}
                        {isStepFinalized && (
                          <button
                            type="button"
                            id={`btn-change-requirement-${row.id}`}
                            onClick={() => handleChangeRequirementClick(row)}
                            className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-white" />
                            Change requirement
                          </button>
                        )}

                        {/* 3. When In Modification: Provide "Modify requirement" and "Finalise requirement" */}
                        {isInModification && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              id={`btn-continue-modify-${row.id}`}
                              onClick={() => handleStartModificationClick(row)}
                              className="py-2 px-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Modify requirement
                            </button>
                            <button
                              type="button"
                              id={`btn-finalize-requirement-${row.id}`}
                              onClick={() => handleFinalizeRequirementClick(row)}
                              className="py-2 px-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-400" />
                              Finalise requirement
                            </button>
                          </div>
                        )}

                        {/* 4. When Analyst Completed Analytics Step: provide "Change requirement" without duplicate status */}
                        {isSubmittedByAnalyst && (
                          <button
                            type="button"
                            id={`btn-change-requirement-${row.id}`}
                            onClick={() => handleChangeRequirementClick(row)}
                            className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-white" />
                            Change requirement
                          </button>
                        )}

                        {/* 5. When Analytics in progress: provide Change requirement action without duplicating status badge */}
                        {isInProgress && !isSubmittedByAnalyst && (
                          <button
                            type="button"
                            id={`btn-modify-in-progress-${row.id}`}
                            onClick={() => handleChangeRequirementClick(row)}
                            className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-white" />
                            Change requirement
                          </button>
                        )}

                        {/* 6. When Requirement Finalized (Signed Off) */}
                        {isSignedOff && !isSubmittedByAnalyst && !isStepFinalized && (
                          <div className="w-full py-1.5 px-2 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            Requirement Finalised
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continuous Row Addition Button for FRC Owner */}
      {rows.length > 0 && !isReadOnly && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-6 text-center shadow-xs">
          <button
            type="button"
            id="btn-add-another-required-row"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Add Waterfall Step (Step {rows.length + 1})
          </button>
        </div>
      )}

          {/* ========================================================================= */}
          {/* QUICK INSIGHTS - CLEAN VERTICAL LIST (BELOW WATERFALL STEPS) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900 tracking-tight">
                Quick Insights
              </h4>
              <span className="text-xs text-stone-400 font-medium">Pipeline Status Overview</span>
            </div>

            {/* Vertical List: Numbers after colon and closer to insight names */}
            <ul className="divide-y divide-stone-100 text-xs mt-1">
              <li className="py-2 flex items-center gap-2 hover:bg-stone-50/60 px-2 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                <span className="font-medium text-stone-700">Total Steps:</span>
                <span className="font-bold text-stone-900">{rows.length}</span>
              </li>

              <li className="py-2 flex items-center gap-2 hover:bg-stone-50/60 px-2 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                <span className="font-medium text-stone-700">Requirement in Draft:</span>
                <span className="font-bold text-stone-900">{draftCount}</span>
              </li>

              <li className="py-2 flex items-center gap-2 hover:bg-stone-50/60 px-2 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium text-stone-700">In Modification:</span>
                <span className="font-bold text-stone-900">{inModificationCount}</span>
              </li>

              <li className="py-2 flex items-center gap-2 hover:bg-stone-50/60 px-2 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                <span className="font-medium text-stone-700">Step Finalized:</span>
                <span className="font-bold text-stone-900">{stepFinalizedCount}</span>
              </li>

              <li className="py-2 flex items-center gap-2 hover:bg-stone-50/60 px-2 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <span className="font-medium text-stone-700">Analytics in Progress:</span>
                <span className="font-bold text-stone-900">{inProgressCount}</span>
              </li>

              <li className="py-2 flex items-center gap-2 hover:bg-stone-50/60 px-2 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-medium text-stone-700">Analytics Step Completed:</span>
                <span className="font-bold text-stone-900">{analyticsCompletedCount}</span>
              </li>
            </ul>
          </div>

          {/* ========================================================================= */}
          {/* GOVERNANCE AND TREND LINE SECTION & DISPUTE RESOLUTION */}
          {/* ========================================================================= */}
          <div className="pt-6 border-t border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-stone-900">Governance and Trend Line Section</h4>
                <p className="text-xs text-stone-500">
                  Project trendline starting from the time when the first project requirement was finalised, tracking population decrease over time on the Y-axis.
                </p>
              </div>
            </div>

            {/* Requirement Timeline Journey Trendline */}
            <TimelineTrendline
              mode="requirements"
              rows={rows}
              title="Project Trendline from First Requirement Finalized"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD REQUIREMENT WATERFALL ROW */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Add Requirement Waterfall Row
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Specify the scoping category, business requirements, and step rationale. The step is saved as draft; you can review with "Modify requirement" or click "Finalise requirement" when ready.
            </p>

            <form onSubmit={handleCreateStep} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(
                      e.target.value as 'Flag accounts/cases' | 'Exclude' | 'Starting Population'
                    )
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-stone-900 focus:outline-hidden font-medium"
                >
                  <option value="Flag accounts/cases">Flag accounts/cases</option>
                  <option value="Exclude">Exclude</option>
                  <option value="Starting Population">Starting Population</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Business Rationale
                </label>
                <textarea
                  required
                  rows={3}
                  value={newRationale}
                  onChange={(e) => setNewRationale(e.target.value)}
                  placeholder="Explain the business rationale, regulatory basis, or policy justification..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-stone-900 focus:outline-hidden leading-relaxed resize-y"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Business Requirements
                </label>
                <textarea
                  required
                  rows={3}
                  value={newBusinessRequirements}
                  onChange={(e) => setNewBusinessRequirements(e.target.value)}
                  placeholder="Specify the business and scoping requirements for this waterfall step..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-stone-900 focus:outline-hidden leading-relaxed resize-y"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1 flex items-center justify-between">
                  <span>Optional Notes</span>
                  <span className="text-[10px] text-stone-400 font-normal">Can be left blank or NA</span>
                </label>
                <textarea
                  rows={2}
                  id="modal-new-notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional scoping notes, edge case observations, or leave blank/NA..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-stone-900 focus:outline-hidden leading-relaxed resize-y"
                />
              </div>

              {/* Insert Files while building requirement */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-stone-600" />
                    <span>Insert Supporting Files</span>
                  </label>
                  <span className="text-[10px] text-stone-400">PDF, Excel, Word, PPT, PNG, JPG</span>
                </div>

                <div className="space-y-2">
                  {/* Drag and Drop Tab with + icon */}
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const newFiles: StepAttachment[] = [];
                        for (let i = 0; i < e.dataTransfer.files.length; i++) {
                          try {
                            const att = await readFileAsAttachment(
                              e.dataTransfer.files[i],
                              'Sarah Jenkins',
                              'FRC Owner'
                            );
                            newFiles.push(att);
                          } catch (err) {
                            console.error(err);
                          }
                        }
                        setDraftAttachments((prev) => [...prev, ...newFiles]);
                      }
                    }}
                    className="border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-white rounded-xl p-3.5 text-center transition-all cursor-pointer flex items-center justify-center gap-2.5 block"
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.svg,.txt,.sql,.zip"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files) {
                          const newFiles: StepAttachment[] = [];
                          for (let i = 0; i < e.target.files.length; i++) {
                            try {
                              const att = await readFileAsAttachment(
                                e.target.files[i],
                                'Sarah Jenkins',
                                'FRC Owner'
                              );
                              newFiles.push(att);
                            } catch (err) {
                              console.error(err);
                            }
                          }
                          setDraftAttachments((prev) => [...prev, ...newFiles]);
                        }
                      }}
                    />
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-stone-800 hover:text-emerald-800 transition-colors">
                        Click here or drag files to upload
                      </p>
                      <p className="text-[10px] text-stone-500">
                        Accepts PDF, Excel (.xlsx, .csv), Word (.docx), PowerPoint (.pptx), Images (.png, .jpg)
                      </p>
                    </div>
                  </label>

                  {draftAttachments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {draftAttachments.map((att, idx) => (
                        <div
                          key={att.id || idx}
                          className="flex items-center justify-between gap-2 p-1.5 bg-white rounded-lg border border-stone-200 text-[11px]"
                        >
                          <span className="truncate text-stone-800 font-medium">{att.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-stone-400 text-[10px]">
                              {formatFileSize(att.size)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setDraftAttachments((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-stone-400 hover:text-rose-600 p-0.5 rounded"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-semibold transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-draft-step"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-xs text-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Save as Draft Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MODIFY REQUIREMENT WORKFLOW (FRC is Modifying Requirement) */}
      {/* ========================================================================= */}
      {editingRow && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Modify Requirement (WFID# {editingRow.id})
              </h3>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* In Modification Notice Banner */}
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Stakeholders Notified:</strong> An alert email has been sent informing the team that FRC is modifying this requirement. The Analyst view reflects status as <strong>&quot;In modification&quot;</strong>.
              </span>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Step Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Rule Reference Code</label>
                <input
                  type="text"
                  required
                  value={editRuleRef}
                  onChange={(e) => setEditRuleRef(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Updated Step Rationale &amp; Policy Justification
                </label>
                <textarea
                  required
                  rows={4}
                  value={editRationaleText}
                  onChange={(e) => setEditRationaleText(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-stone-900 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Change Summary / Justification
                </label>
                <input
                  type="text"
                  required
                  value={editChangeSummary}
                  onChange={(e) => setEditChangeSummary(e.target.value)}
                  placeholder="e.g. Broadened exclusion criteria per Legal advisory memorandum"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-commit-modification"
                    onClick={handleCommitModificationOnly}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Save modified requirement changes without finalizing, allowing further updates"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                    Commit Modification
                  </button>
                  <button
                    type="button"
                    id="btn-submit-modified-requirement"
                    onClick={handleSubmitModificationAndFinalize}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Commit changes and finalize requirement for analyst execution"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    Finalize Requirement
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DISPATCHED EMAIL INSPECTION & PREVIEW */}
      {/* ========================================================================= */}
      {activeEmailData && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Stakeholder Email Dispatched
                  </h3>
                  <p className="text-xs text-stone-500">
                    Step {activeEmailData.stepId} • {activeEmailData.stepTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveEmailData(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metadata */}
            <div className="space-y-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-bold w-12 shrink-0">TO:</span>
                <span className="text-stone-900 font-semibold">{activeEmailData.recipients.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-bold w-12 shrink-0">CC:</span>
                <span className="text-stone-700">{activeEmailData.cc.join(', ')}</span>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-stone-200">
                <span className="text-stone-500 font-bold w-12 shrink-0">SUBJECT:</span>
                <span className="text-stone-900 font-bold font-sans">{activeEmailData.subject}</span>
              </div>
            </div>

            {/* Email Body */}
            <div>
              <span className="text-[11px] font-bold text-stone-600 block mb-1 uppercase tracking-wider">
                Delivered Email Content
              </span>
              <pre className="p-3.5 bg-stone-950 text-stone-100 text-[11px] font-mono rounded-xl overflow-y-auto max-h-72 border border-stone-800 whitespace-pre-wrap leading-relaxed select-all">
                {activeEmailData.body}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <div className="text-[11px] text-stone-500">
                Audit Status: <strong>Finalized &amp; Logged</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyEmail(activeEmailData.body)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 transition-colors flex items-center gap-1.5"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                      Copy Text
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenMailto(activeEmailData)}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  Open in Mail Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Step Confirmation Modal */}
      {rowToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-rose-50 border-b border-rose-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950">
                  Delete Waterfall Step WFID# {rowToDelete.id}?
                </h3>
                <p className="text-xs text-rose-700">
                  Permanent removal from waterfall governance scope
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-stone-700 leading-relaxed">
                Are you sure you want to completely delete step <strong>{rowToDelete.id}: &ldquo;{rowToDelete.stepTitle}&rdquo;</strong>?
              </p>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                <div><span className="font-semibold text-stone-700">Category:</span> {rowToDelete.category}</div>
                <div><span className="font-semibold text-stone-700">Rule Reference:</span> {rowToDelete.ruleReference}</div>
                {rowToDelete.businessRequirements && (
                  <div className="line-clamp-2"><span className="font-semibold text-stone-700">Requirements:</span> {rowToDelete.businessRequirements}</div>
                )}
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Audit Log Note:</strong> No email will be dispatched to project stakeholders. The deletion event will be permanently recorded in the collaborative audit trail for dispute resolution.
                </span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRowToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-step"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Step Completely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Requirement Confirmation Modal (Pausing Analytics) */}
      {changeRequirementConfirmRow && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Change Requirement (WFID# {changeRequirementConfirmRow.id})
                </h3>
                <p className="text-xs text-amber-700">
                  Analytics Step Warning
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                The analytics work is in progress and this action would mean the analytics will be paused for this step until new requirement is finalised. Do you want to proceed?
              </p>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                <div><span className="font-semibold text-stone-700">Step:</span> {changeRequirementConfirmRow.rationale || changeRequirementConfirmRow.stepTitle}</div>
                {changeRequirementConfirmRow.businessRequirements && (
                  <div className="line-clamp-2"><span className="font-semibold text-stone-700">Current Requirement:</span> {changeRequirementConfirmRow.businessRequirements}</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="btn-cancel-change-requirement"
                onClick={() => setChangeRequirementConfirmRow(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                No
              </button>
              <button
                type="button"
                id="btn-confirm-change-requirement"
                onClick={handleConfirmChangeRequirement}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
