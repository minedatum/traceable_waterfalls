import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FolderArchive,
  UploadCloud,
  CheckCircle2,
  FolderOpen,
  Layers,
  FileCheck2,
  FolderSync,
} from 'lucide-react';
import {
  ScannedFile,
  ExpectedDeliverable,
  DeliverableAuditResult,
  PhaseId,
  UserRole,
  AnalystTab,
  WaterfallRow,
  WaterfallStepVersion,
  AuditLogEntry,
  ProjectDetails,
  WaterfallEntity,
  ProjectEntity,
} from './types';
import {
  DEFAULT_DELIVERABLES,
  SAMPLE_WATERFALL_FILES,
} from './data/waterfallTemplate';
import {
  INITIAL_WATERFALL_ROWS,
  INITIAL_AUDIT_LOGS,
  DEMO_WATERFALL_ROWS,
  DEMO_AUDIT_LOGS,
} from './data/egrcWaterfallData';
import { calculateWorkingDays } from './utils/workingDays';
import { performAudit } from './utils/auditor';
import { exportAnalystViewToExcel } from './utils/exportUtils';
import { Header } from './components/Header';
import { FRCWorkspace } from './components/FRCWorkspace';
import { AnalystWorkspace } from './components/AnalystWorkspace';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { PhasePipeline } from './components/PhasePipeline';
import { DeliverablesTable } from './components/DeliverablesTable';
import { DeliverableModal } from './components/DeliverableModal';
import { ReportExportModal } from './components/ReportExportModal';
import { RulesEditorModal } from './components/RulesEditorModal';
import { ScaffoldModal } from './components/ScaffoldModal';
import { RefreshDataModal } from './components/RefreshDataModal';
import { AddWaterfallModal, CreateProjectModal } from './components/CreateWaterfallModals';

export default function App() {
  // Dual-Role State (persisted in localStorage)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('egrc_user_role');
      if (saved === 'frc' || saved === 'analyst') return saved;
    } catch {
      // ignore
    }
    return 'frc';
  });

  // Active Analyst Tab (persisted in localStorage)
  const [analystTab, setAnalystTab] = useState<AnalystTab>(() => {
    try {
      const saved = localStorage.getItem('egrc_analyst_tab');
      if (saved === 'table' || saved === 'start' || saved === 'complete' || saved === 'evolving') return saved as AnalystTab;
    } catch {
      // ignore
    }
    return 'table';
  });

  // Waterfall Scoping Rows (starts completely empty with 0 steps for fresh testing)
  const [waterfallRows, setWaterfallRows] = useState<WaterfallRow[]>(() => {
    try {
      const cleanInit = localStorage.getItem('egrc_clean_slate_v3');
      if (!cleanInit) {
        // Reset any past browser cache to guarantee clean slate of 0 rows
        localStorage.removeItem('egrc_waterfall_rows');
        localStorage.removeItem('egrc_audit_logs');
        localStorage.setItem('egrc_clean_slate_v3', 'true');
        return [];
      }
      const saved = localStorage.getItem('egrc_waterfall_rows');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Consolidated Activity Audit Logs (starts clean with 0 entries for fresh testing)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const cleanInit = localStorage.getItem('egrc_clean_slate_v3');
      if (!cleanInit) {
        return [];
      }
      const saved = localStorage.getItem('egrc_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Mandatory Project Governance Details (COE#, eGRC#, Issue Title, FRC Name, Analyst Name, Waterfall Name)
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(() => {
    try {
      const saved = localStorage.getItem('egrc_project_details');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      coeNumber: 'COE-2026-0891',
      egrcNumber: 'eGRC-REQ-4421',
      issueTitle: 'Card Lending Overlimit Interest Recalibration & Regulatory Reporting',
      issueDescription: 'Remediation and historical recalculation of account balances and regulatory reporting discrepancies across overlimit consumer credit portfolios.',
      frcName: 'Sarah Jenkins',
      analystName: 'Alex Morgan',
      waterfallName: 'Q3 Card Portfolio Remediation Waterfall',
    };
  });

  // Secondary sub-view toggle: Show Deliverables File Gate Auditor
  const [showFileGatesAuditor, setShowFileGatesAuditor] = useState<boolean>(false);

  // Multi-Waterfall & Project Management State
  const [waterfalls, setWaterfalls] = useState<WaterfallEntity[]>(() => {
    try {
      const saved = localStorage.getItem('egrc_waterfalls_list');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'wf-default-1',
        name: 'Q3 Card Portfolio Remediation Waterfall',
        createdAt: new Date().toISOString(),
        rows: [],
        auditLogs: [],
      },
    ];
  });

  const [activeWaterfallId, setActiveWaterfallId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('egrc_active_waterfall_id');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'wf-default-1';
  });

  const [isAddWaterfallOpen, setIsAddWaterfallOpen] = useState<boolean>(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState<boolean>(false);

  // Drawer / Modals State
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showScaffoldModal, setShowScaffoldModal] = useState<boolean>(false);
  const [showRefreshModal, setShowRefreshModal] = useState<boolean>(false);

  // Deliverables Auditor File State
  const [files, setFiles] = useState<ScannedFile[]>(SAMPLE_WATERFALL_FILES);
  const [deliverables, setDeliverables] = useState<ExpectedDeliverable[]>(DEFAULT_DELIVERABLES);
  const [targetPath, setTargetPath] = useState<string>('H:\\My Drive\\Waterfall');
  const [folderName, setFolderName] = useState<string>('H:\\My Drive\\Waterfall');
  const [isUsingSample, setIsUsingSample] = useState<boolean>(true);

  // Filters & Selected states for Deliverables Table
  const [selectedPhase, setSelectedPhase] = useState<PhaseId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inspectedItem, setInspectedItem] = useState<DeliverableAuditResult | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('egrc_user_role', userRole);
    } catch {
      // ignore
    }
  }, [userRole]);

  useEffect(() => {
    try {
      localStorage.setItem('egrc_analyst_tab', analystTab);
    } catch {
      // ignore
    }
  }, [analystTab]);

  useEffect(() => {
    try {
      localStorage.setItem('egrc_waterfall_rows', JSON.stringify(waterfallRows));
    } catch {
      // ignore
    }
  }, [waterfallRows]);

  useEffect(() => {
    try {
      localStorage.setItem('egrc_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('egrc_project_details', JSON.stringify(projectDetails));
    } catch {
      // ignore
    }
  }, [projectDetails]);

  useEffect(() => {
    try {
      localStorage.setItem('egrc_waterfalls_list', JSON.stringify(waterfalls));
    } catch {
      // ignore
    }
  }, [waterfalls]);

  useEffect(() => {
    try {
      localStorage.setItem('egrc_active_waterfall_id', activeWaterfallId);
    } catch {
      // ignore
    }
  }, [activeWaterfallId]);

  // Append new audit log helper
  const addAuditLog = useCallback(
    (
      action: string,
      role: 'FRC Owner' | 'Analyst' | 'System',
      user: string,
      details: string,
      rowId?: string,
      eventType?: AuditLogEntry['eventType'],
      disputeCategory?: AuditLogEntry['disputeCategory']
    ) => {
      const target = rowId ? waterfallRows.find((r) => r.id === rowId) : undefined;
      const newEntry: AuditLogEntry = {
        id: `LOG-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        user,
        role,
        action,
        rowId,
        stepTitle: target?.stepTitle,
        details,
        eventType: eventType || 'general',
        disputeCategory,
      };
      setAuditLogs((prev) => [newEntry, ...prev]);
    },
    [waterfallRows]
  );

  // Handle Role Change
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    addAuditLog(
      `Workspace View Switched to ${newRole === 'frc' ? 'FRC Workspace' : 'Analyst Workspace'}`,
      newRole === 'frc' ? 'FRC Owner' : 'Analyst',
      newRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      `User toggled role view in header to ${newRole.toUpperCase()}.`
    );
  };

  // FRC: Add New Step
  const handleAddStep = (
    newRowData: Omit<WaterfallRow, 'id' | 'stepNumber' | 'versions' | 'lastUpdated'>
  ) => {
    const nextNum = waterfallRows.length + 1;
    const newId = `WF-0${nextNum}`;
    const initialVersion: WaterfallStepVersion = {
      versionNumber: 1,
      timestamp: new Date().toISOString(),
      author: 'Sarah Jenkins',
      role: 'FRC Owner',
      rationale: newRowData.rationale,
      changeSummary: 'Baseline step formulated by FRC Owner.',
      excludeCount: newRowData.excludeCount,
      includeCaseCount: newRowData.includeCaseCount,
      includeUniqueAccountCount: newRowData.includeUniqueAccountCount,
      startDate: newRowData.startDate,
      endDate: newRowData.endDate,
      workingDays: newRowData.workingDays,
    };

    const newRow: WaterfallRow = {
      ...newRowData,
      id: newId,
      stepNumber: nextNum,
      lastUpdated: new Date().toISOString(),
      versions: [initialVersion],
    };

    setWaterfallRows((prev) => [...prev, newRow]);
    addAuditLog(
      'New Step Formulated',
      'FRC Owner',
      'Sarah Jenkins',
      `Formulated Step ${nextNum} (${newId}): "${newRow.stepTitle}" under rule [${newRow.ruleReference}].`,
      newId
    );
  };

  // FRC: Update Row Rationale / Rule Reference (bumps version)
  const handleUpdateRow = (
    rowId: string,
    updates: Partial<WaterfallRow>,
    changeSummary?: string
  ) => {
    setWaterfallRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const newVersionNum = row.versions.length + 1;
        const newVersion: WaterfallStepVersion = {
          versionNumber: newVersionNum,
          timestamp: new Date().toISOString(),
          author: 'Sarah Jenkins',
          role: 'FRC Owner',
          rationale: updates.rationale || row.rationale,
          changeSummary: changeSummary || 'Modified step rationale by FRC Owner.',
          excludeCount: row.excludeCount,
          includeCaseCount: row.includeCaseCount,
          includeUniqueAccountCount: row.includeUniqueAccountCount,
          startDate: row.startDate,
          endDate: row.endDate,
          workingDays: row.workingDays,
        };

        return {
          ...row,
          ...updates,
          lastUpdated: new Date().toISOString(),
          versions: [...row.versions, newVersion],
        };
      })
    );

    addAuditLog(
      'Step rationale modified by FRC',
      'FRC Owner',
      'Sarah Jenkins',
      changeSummary || `Updated rationale for ${rowId}. Version v${(waterfallRows.find((r) => r.id === rowId)?.versions.length || 0) + 1} generated.`,
      rowId
    );
  };

  // FRC: Finalize Requirement (Triggers stakeholder email and sets status to step_finalized)
  const handleFinalizeRequirement = (
    rowId: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => {
    const timestamp = new Date().toISOString();
    setWaterfallRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              status: 'step_finalized' as const,
              emailTriggeredAt: timestamp,
              requirementFinalizedAt: r.requirementFinalizedAt || timestamp,
              requirementLatestFinalizedAt: timestamp,
              refinalizeCount: r.refinalizeCount ?? 0,
              lastEmailRecipients: emailDetails?.recipients,
              lastEmailSubject: emailDetails?.subject,
              lastEmailBody: emailDetails?.body,
            }
          : r
      )
    );

    addAuditLog(
      'Requirement Finalized by FRC',
      'FRC Owner',
      'Sarah Jenkins',
      `FRC finalized requirement for ${rowId}. Status moved to STEP FINALIZED. Stakeholder email alert dispatched to: ${
        emailDetails?.recipients.join(', ') || 'alex.morgan@enterprise.bank, marcus.vance.pmo@enterprise.bank'
      }.`,
      rowId,
      'requirement_finalized',
      'signoff_milestone'
    );
  };

  // FRC: Start Modification (Triggers stakeholder email and sets status to in_modification)
  const handleStartModification = (
    rowId: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => {
    const timestamp = new Date().toISOString();
    setWaterfallRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              status: 'in_modification' as const,
              emailTriggeredAt: timestamp,
              lastEmailRecipients: emailDetails?.recipients,
              lastEmailSubject: emailDetails?.subject,
              lastEmailBody: emailDetails?.body,
            }
          : r
      )
    );

    addAuditLog(
      'FRC Initiated Requirement Modification',
      'FRC Owner',
      'Sarah Jenkins',
      `FRC initiated modification for ${rowId}. Status moved to IN MODIFICATION. Alert email dispatched to: ${
        emailDetails?.recipients.join(', ') || 'alex.morgan@enterprise.bank, marcus.vance.pmo@enterprise.bank'
      }.`,
      rowId,
      'modification_started',
      'scope_change'
    );
  };

  // FRC: Submit Modified Requirement (Triggers stakeholder email, creates version, sets status to step_finalized)
  const handleSubmitModifiedRequirement = (
    rowId: string,
    updates: Partial<WaterfallRow>,
    changeSummary: string,
    emailDetails?: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => {
    const timestamp = new Date().toISOString();
    const targetRow = waterfallRows.find((r) => r.id === rowId);
    const newRefinalizeCount = (targetRow?.refinalizeCount || 0) + 1;

    setWaterfallRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const newVersionNum = row.versions.length + 1;
        const newVersion: WaterfallStepVersion = {
          versionNumber: newVersionNum,
          timestamp,
          author: 'Sarah Jenkins',
          role: 'FRC Owner',
          rationale: updates.rationale || row.rationale,
          changeSummary: changeSummary || 'FRC modified and re-finalized requirement.',
          excludeCount: row.excludeCount,
          includeCaseCount: row.includeCaseCount,
          includeUniqueAccountCount: row.includeUniqueAccountCount,
          startDate: row.startDate,
          endDate: row.endDate,
          workingDays: row.workingDays,
        };

        return {
          ...row,
          ...updates,
          status: 'step_finalized' as const,
          lastUpdated: timestamp,
          emailTriggeredAt: timestamp,
          requirementFinalizedAt: row.requirementFinalizedAt || timestamp,
          requirementLatestFinalizedAt: timestamp,
          refinalizeCount: newRefinalizeCount,
          lastEmailRecipients: emailDetails?.recipients,
          lastEmailSubject: emailDetails?.subject,
          lastEmailBody: emailDetails?.body,
          versions: [...row.versions, newVersion],
        };
      })
    );

    addAuditLog(
      'Modified Requirement Re-Finalized by FRC',
      'FRC Owner',
      'Sarah Jenkins',
      `FRC re-finalized requirement for ${rowId} (re-finalization #${newRefinalizeCount}). Version v${
        (targetRow?.versions.length || 0) + 1
      } generated. Status updated to STEP FINALIZED. Stakeholder email alert dispatched.`,
      rowId,
      'requirement_refinalized',
      'scope_change'
    );
  };

  // FRC: Submit Row to Analyst
  const handleSubmitToAnalyst = (rowId: string) => {
    setWaterfallRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status: 'step_finalized' as const } : r))
    );
    addAuditLog(
      'Requirement finalized to Analyst',
      'FRC Owner',
      'Sarah Jenkins',
      `Dispatched step ${rowId} to Analyst queue. Status set to STEP FINALIZED.`,
      rowId
    );
  };

  // FRC: Sign Off Step
  const handleSignOffRow = (rowId: string) => {
    setWaterfallRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status: 'signed_off' as const } : r))
    );
    addAuditLog(
      'Requirement finalised',
      'FRC Owner',
      'Sarah Jenkins',
      `Formal FRC requirement finalisation completed for ${rowId}. Step locked for downstream reporting.`,
      rowId,
      'sign_off',
      'signoff_milestone'
    );
  };

  // FRC: Delete Step completely (no email triggered, transaction logged in audit trail)
  const handleDeleteStep = (rowId: string) => {
    const targetStep = waterfallRows.find((r) => r.id === rowId);
    if (!targetStep) return;

    setWaterfallRows((prev) => {
      const remaining = prev.filter((r) => r.id !== rowId);
      return remaining.map((row, idx) => ({
        ...row,
        stepNumber: idx + 1,
      }));
    });

    addAuditLog(
      `Waterfall Step Deleted (${rowId})`,
      'FRC Owner',
      'Sarah Jenkins',
      `FRC Owner Sarah Jenkins completely deleted Waterfall Step ${rowId}: "${targetStep.stepTitle}". Category: ${targetStep.category}, Rule Reference: ${targetStep.ruleReference}. Deletion recorded in audit trail without outbound email dispatch.`,
      rowId,
      'general',
      'scope_change'
    );
  };

  // Analyst: Update Counts and Schedule
  const handleUpdateCountsAndSchedule = (
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
  ) => {
    const existing = waterfallRows.find((r) => r.id === rowId);
    const isRerun = (updates.rerunCount ?? 0) > (existing?.rerunCount ?? 0);

    setWaterfallRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const newVersionNum = row.versions.length + 1;
        const newVersion: WaterfallStepVersion = {
          versionNumber: newVersionNum,
          timestamp: new Date().toISOString(),
          author: 'Alex Morgan',
          role: 'Analyst',
          rationale: row.rationale,
          changeSummary:
            changeSummary ||
            `Analyst updated requirements, counts (Exclude: ${updates.excludeCount.toLocaleString()}, Include: ${updates.includeCaseCount.toLocaleString()}) and days (${updates.workingDays}d).`,
          excludeCount: updates.excludeCount,
          includeCaseCount: updates.includeCaseCount,
          includeUniqueAccountCount: updates.includeUniqueAccountCount,
          startDate: updates.startDate,
          endDate: updates.endDate,
          workingDays: updates.workingDays,
        };

        return {
          ...row,
          ...updates,
          lastUpdated: new Date().toISOString(),
          versions: [...row.versions, newVersion],
        };
      })
    );

    addAuditLog(
      isRerun ? `Analytics Re-run #${updates.rerunCount} by Analyst` : 'Waterfall step modified by Analyst',
      'Analyst',
      'Alex Morgan',
      changeSummary ||
        `Updated ${rowId}: Exclude=${updates.excludeCount.toLocaleString()}, Include=${updates.includeCaseCount.toLocaleString()}, Accounts=${updates.includeUniqueAccountCount.toLocaleString()} | Days: ${updates.workingDays}d`,
      rowId,
      isRerun ? 'analytics_rerun' : 'general',
      isRerun ? 'analytical_rework' : undefined
    );
  };

  // Analyst: Status Change
  const handleAnalystStatusChange = (rowId: string, newStatus: WaterfallRow['status']) => {
    const nowIso = new Date().toISOString();
    setWaterfallRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              status: newStatus,
              analyticsFirstFinalizedAt:
                newStatus === 'ready_for_review' || newStatus === 'signed_off'
                  ? r.analyticsFirstFinalizedAt || nowIso
                  : r.analyticsFirstFinalizedAt,
              analyticsLatestFinalizedAt:
                newStatus === 'ready_for_review' || newStatus === 'signed_off'
                  ? nowIso
                  : r.analyticsLatestFinalizedAt,
            }
          : r
      )
    );
    addAuditLog(
      `Status changed to ${newStatus.replace(/_/g, ' ')}`,
      'Analyst',
      'Alex Morgan',
      `Analyst moved ${rowId} to status: ${newStatus.toUpperCase()}`,
      rowId,
      newStatus === 'ready_for_review' ? 'analytics_finalized' : 'general',
      newStatus === 'ready_for_review' ? 'signoff_milestone' : undefined
    );
  };

  // Analyst: Trigger Email Notification to Project Team
  const handleTriggerEmailNotification = (
    rowId: string,
    emailDetails: {
      recipients: string[];
      subject: string;
      body: string;
      stepTitle?: string;
    }
  ) => {
    const timestamp = new Date().toISOString();
    const existing = waterfallRows.find((r) => r.id === rowId);
    const isRerun = Boolean(
      existing?.analyticsCompletedAt ||
      existing?.status === 'in_analysis' ||
      existing?.status === 'ready_for_review' ||
      (existing?.rerunCount && existing.rerunCount > 0)
    );
    const newRerunCount = isRerun ? (existing?.rerunCount || 0) + 1 : (existing?.rerunCount || 0);

    setWaterfallRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              analyticsCompletedAt: timestamp,
              emailTriggeredAt: timestamp,
              rerunCount: newRerunCount,
              lastEmailRecipients: emailDetails.recipients,
            }
          : r
      )
    );

    addAuditLog(
      isRerun
        ? `Analytics Re-run #${newRerunCount} Dispatched (${rowId})`
        : `Email Notification Triggered to Project Team (${rowId})`,
      'Analyst',
      'Alex Morgan',
      `Analytics alert triggered for ${rowId}. Notification dispatched to Project Team: ${emailDetails.recipients.join(', ')}. Subject: "${emailDetails.subject}"`,
      rowId,
      isRerun ? 'analytics_rerun' : 'analytics_started',
      'analytical_rework'
    );
  };

  // Handle "Refresh Data" across all analytical steps and trigger enterprise email notification
  const handleConfirmRefreshData = (emailPayload: {
    recipients: string[];
    subject: string;
    body: string;
    customNote: string;
  }) => {
    const timestamp = new Date().toISOString();

    // Update all rows: mark refreshed, update timestamp, and record rerun count
    setWaterfallRows((prev) =>
      prev.map((r) => ({
        ...r,
        analyticsCompletedAt: timestamp,
        emailTriggeredAt: timestamp,
        rerunCount: (r.rerunCount || 0) + 1,
        lastEmailRecipients: emailPayload.recipients,
        lastEmailSubject: emailPayload.subject,
        lastEmailBody: emailPayload.body,
        notes: emailPayload.customNote
          ? `${r.notes ? r.notes + '\n' : ''}[Data Refreshed: ${emailPayload.customNote}]`
          : r.notes,
      }))
    );

    addAuditLog(
      'Full Analytical Data Refresh Dispatched',
      userRole === 'frc' ? 'FRC Governance' : 'Analyst',
      userRole === 'frc' ? 'FRC Governance Team' : 'Lead Analyst Team',
      `Enterprise-wide Data Refresh triggered across all ${waterfallRows.length} analytical steps. Notification email dispatched to: ${emailPayload.recipients.join(', ')}.`,
      'all',
      'analytics_rerun',
      'analytical_rework'
    );
  };

  // Reset entire workspace back to clean slate for first-time use / leadership demonstration
  const handleResetToCleanSlate = () => {
    setWaterfallRows([]);
    setAuditLogs([]);
    try {
      localStorage.setItem('egrc_waterfall_rows', JSON.stringify([]));
      localStorage.setItem('egrc_audit_logs', JSON.stringify([]));
      localStorage.setItem('egrc_clean_slate_v3', 'true');
    } catch {
      // ignore
    }
    addAuditLog(
      'Workspace Reset to Clean Slate',
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      'All waterfall steps and progress cleared for clean testing.'
    );
  };

  // Optional: Load sample dataset during leadership demo
  const handleLoadSampleDemo = () => {
    setWaterfallRows(DEMO_WATERFALL_ROWS);
    setAuditLogs(DEMO_AUDIT_LOGS);
    try {
      localStorage.setItem('egrc_waterfall_rows', JSON.stringify(DEMO_WATERFALL_ROWS));
      localStorage.setItem('egrc_audit_logs', JSON.stringify(DEMO_AUDIT_LOGS));
    } catch {
      // ignore
    }
    addAuditLog(
      'Sample Demo Dataset Loaded',
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      'Loaded 6 demonstration waterfall steps and historical analytics.'
    );
  };

  // Save / Update Project Details (FRC Governed)
  const handleSaveProjectDetails = (updated: ProjectDetails) => {
    setProjectDetails(updated);
    // Also update active waterfall's name in waterfalls array
    setWaterfalls((prev) =>
      prev.map((wf) => (wf.id === activeWaterfallId ? { ...wf, name: updated.waterfallName } : wf))
    );
    addAuditLog(
      'Project Governance Details Updated',
      'FRC Owner',
      'Sarah Jenkins',
      `Project details updated: COE# "${updated.coeNumber}", eGRC# "${updated.egrcNumber}", Waterfall: "${updated.waterfallName}", Issue: "${updated.issueTitle}", FRC: "${updated.frcName}", Analyst: "${updated.analystName}"`,
      undefined,
      'draft_saved',
      'scope_change'
    );
  };

  // Switch Active Waterfall
  const handleSelectWaterfall = (waterfallId: string) => {
    // 1. Save current active waterfall rows
    setWaterfalls((prev) =>
      prev.map((wf) => (wf.id === activeWaterfallId ? { ...wf, rows: waterfallRows } : wf))
    );

    // 2. Load the target waterfall
    const targetWf = waterfalls.find((w) => w.id === waterfallId);
    if (targetWf) {
      setActiveWaterfallId(targetWf.id);
      setWaterfallRows(targetWf.rows || []);
      setProjectDetails((prev) => ({
        ...prev,
        waterfallName: targetWf.name,
      }));
      addAuditLog(
        `Switched Active Waterfall to: ${targetWf.name}`,
        userRole === 'frc' ? 'FRC Owner' : 'Analyst',
        userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
        `Switched workspace view to waterfall "${targetWf.name}" with ${targetWf.rows?.length || 0} rows.`
      );
    }
  };

  // Option 1: Add New Waterfall (Inherits existing project governance details)
  const handleAddWaterfall = (waterfallName: string) => {
    // Save current active rows first
    const updatedWaterfalls = waterfalls.map((wf) =>
      wf.id === activeWaterfallId ? { ...wf, rows: waterfallRows } : wf
    );

    const newWaterfallId = `wf-${Date.now().toString().slice(-6)}`;
    const newWf: WaterfallEntity = {
      id: newWaterfallId,
      name: waterfallName,
      createdAt: new Date().toISOString(),
      rows: [],
      auditLogs: [],
    };

    setWaterfalls([...updatedWaterfalls, newWf]);
    setActiveWaterfallId(newWaterfallId);
    setWaterfallRows([]);
    setProjectDetails((prev) => ({
      ...prev,
      waterfallName,
    }));

    addAuditLog(
      `New Waterfall Added: ${waterfallName}`,
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      `Created additional waterfall "${waterfallName}" under project "${projectDetails.issueTitle}" (COE# ${projectDetails.coeNumber}). All project governance details inherited.`
    );
  };

  // Option 2: Create Brand New Project (Fresh COE#, eGRC#, Title, leads, and initial waterfall)
  const handleCreateNewProject = (newProject: ProjectDetails) => {
    const newWaterfallId = `wf-${Date.now().toString().slice(-6)}`;
    const newWf: WaterfallEntity = {
      id: newWaterfallId,
      name: newProject.waterfallName,
      createdAt: new Date().toISOString(),
      rows: [],
      auditLogs: [],
    };

    setProjectDetails(newProject);
    setWaterfalls([newWf]);
    setActiveWaterfallId(newWaterfallId);
    setWaterfallRows([]);
    setAuditLogs([]);

    try {
      localStorage.setItem('egrc_project_details', JSON.stringify(newProject));
      localStorage.setItem('egrc_waterfalls_list', JSON.stringify([newWf]));
      localStorage.setItem('egrc_active_waterfall_id', newWaterfallId);
      localStorage.setItem('egrc_waterfall_rows', JSON.stringify([]));
      localStorage.setItem('egrc_audit_logs', JSON.stringify([]));
    } catch {
      // ignore
    }

    addAuditLog(
      `Brand New Project Created: ${newProject.issueTitle}`,
      'FRC Owner',
      newProject.frcName || 'FRC Owner',
      `Initialized fresh project specification: COE# "${newProject.coeNumber}", eGRC# "${newProject.egrcNumber}", Waterfall: "${newProject.waterfallName}".`
    );
  };

  // Deliverables Auditor Calculation
  const report = useMemo(() => {
    return performAudit(files, deliverables, folderName);
  }, [files, deliverables, folderName]);

  // Handle uploaded files from input or drag-and-drop
  const handleFilesIngested = useCallback((fileList: FileList) => {
    const scanned: ScannedFile[] = [];
    let detectedRootFolder = '';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;

      if (!detectedRootFolder && file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          detectedRootFolder = parts[0];
        }
      }

      const ext = file.name.includes('.')
        ? file.name.split('.').pop()?.toLowerCase() || ''
        : '';

      scanned.push({
        id: `scanned-${Date.now()}-${i}`,
        name: file.name,
        path: relPath,
        size: file.size,
        lastModified: file.lastModified || Date.now(),
        extension: ext,
      });
    }

    if (scanned.length > 0) {
      setFiles(scanned);
      setIsUsingSample(false);
      setFolderName(detectedRootFolder ? `Waterfall/${detectedRootFolder}` : 'Uploaded_Waterfall_Folder');
    }
  }, []);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesIngested(e.dataTransfer.files);
    }
  };

  // Restore sample project
  const handleLoadSample = () => {
    setFiles(SAMPLE_WATERFALL_FILES);
    setFolderName('H:\\My Drive\\Waterfall');
    setIsUsingSample(true);
    setSelectedPhase('all');
    setStatusFilter('all');
  };

  // Directory scaffolding handler
  const handleDirectoryScaffoldSuccess = (createdPaths: string[]) => {
    const newScanned: ScannedFile[] = createdPaths.map((p, idx) => {
      const parts = p.split('/');
      const fileName = parts[parts.length - 1];
      const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';
      return {
        id: `scaffolded-${Date.now()}-${idx}`,
        name: fileName,
        path: `${targetPath}\\${p.replace(/\//g, '\\')}`,
        size: 2048,
        lastModified: Date.now(),
        extension: ext,
      };
    });

    setFiles((prev) => [...newScanned, ...prev]);
    addAuditLog(
      'Files scaffolded to Google Drive',
      userRole === 'frc' ? 'FRC Owner' : 'Analyst',
      userRole === 'frc' ? 'Sarah Jenkins' : 'Alex Morgan',
      `Scaffolded ${createdPaths.length} deliverable templates to H:\\My Drive\\Waterfall.`
    );
  };

  const handleAttachSingleFile = (deliverableId: string, file: File) => {
    const ext = file.name.includes('.')
      ? file.name.split('.').pop()?.toLowerCase() || ''
      : '';

    const newScannedFile: ScannedFile = {
      id: `attached-${Date.now()}`,
      name: file.name,
      path: `${folderName}/${file.name}`,
      size: file.size,
      lastModified: file.lastModified || Date.now(),
      extension: ext,
      matchedDeliverableId: deliverableId,
    };

    setFiles((prev) => [newScannedFile, ...prev]);

    setInspectedItem((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'up-to-date',
        matchedFile: newScannedFile,
        reason: `Manually verified & uploaded file: ${newScannedFile.name}`,
        daysOld: 0,
      };
    });
  };

  const handleSelectUnmatchedFile = (file: ScannedFile) => {
    alert(
      `File: ${file.name}\nPath: ${file.path}\nSize: ${(file.size / 1024).toFixed(
        1
      )} KB\n\nThis file is not matched to standard Waterfall specifications. You can add a custom deliverable pattern in 'Audit Rules' to track it.`
    );
  };

  return (
    <div
      id="waterfall-app-root"
      className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans relative antialiased selection:bg-stone-900 selection:text-white"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div
          id="drop-zone-overlay"
          className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white border-4 border-dashed border-emerald-400 m-4 rounded-3xl"
        >
          <UploadCloud className="w-16 h-16 text-emerald-400 animate-bounce mb-4" />
          <h3 className="text-xl font-bold">Drop your Waterfall folder here</h3>
          <p className="text-sm text-stone-300 mt-1">
            Instantly inspect all project deliverables, phase readiness, and outdated assets
          </p>
        </div>
      )}

      {/* Top Header with Persistent Role Toggle & Audit Log Drawer Trigger */}
      <Header
        report={report}
        userRole={userRole}
        onRoleChange={handleRoleChange}
        onOpenAuditLogs={() => setIsAuditLogOpen(true)}
        auditLogsCount={auditLogs.length}
        onFilesSelected={handleFilesIngested}
        onLoadSample={handleLoadSample}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenScaffold={() => setShowScaffoldModal(true)}
        isUsingSample={isUsingSample}
        folderName={folderName}
        onResetToCleanSlate={handleResetToCleanSlate}
        onLoadSampleDemo={handleLoadSampleDemo}
        waterfallRowsCount={waterfallRows.length}
        onRefreshData={() => setShowRefreshModal(true)}
        onExportExcel={() => {
          // Sync active waterfall rows in current waterfalls list before exporting
          const currentWaterfalls = waterfalls.map((wf) =>
            wf.id === activeWaterfallId ? { ...wf, rows: waterfallRows } : wf
          );
          exportAnalystViewToExcel(
            waterfallRows,
            undefined,
            'Waterfall_Analyst_Requirements.xlsx',
            projectDetails,
            currentWaterfalls
          );
        }}
        onOpenAddWaterfall={() => setIsAddWaterfallOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        waterfalls={waterfalls}
        activeWaterfallId={activeWaterfallId}
        onSelectWaterfall={handleSelectWaterfall}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* PRIMARY VIEW RENDERING BASED ON ROLE */}
        {userRole === 'frc' ? (
          <FRCWorkspace
            rows={waterfallRows}
            auditLogs={auditLogs}
            projectDetails={projectDetails}
            waterfalls={waterfalls}
            activeWaterfallId={activeWaterfallId}
            onSelectWaterfall={handleSelectWaterfall}
            onOpenAddWaterfall={() => setIsAddWaterfallOpen(true)}
            onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            onOpenAuditLogs={() => setIsAuditLogOpen(true)}
            onSaveProjectDetails={handleSaveProjectDetails}
            onAddRow={handleAddStep}
            onUpdateRow={handleUpdateRow}
            onSubmitToAnalyst={handleSubmitToAnalyst}
            onSignOffRow={handleSignOffRow}
            onFinalizeRequirement={handleFinalizeRequirement}
            onStartModification={handleStartModification}
            onSubmitModifiedRequirement={handleSubmitModifiedRequirement}
            onTriggerEmailNotification={handleTriggerEmailNotification}
            onDeleteRow={handleDeleteStep}
          />
        ) : (
          <AnalystWorkspace
            rows={waterfallRows}
            auditLogs={auditLogs}
            projectDetails={projectDetails}
            waterfalls={waterfalls}
            activeWaterfallId={activeWaterfallId}
            onSelectWaterfall={handleSelectWaterfall}
            onOpenAddWaterfall={() => setIsAddWaterfallOpen(true)}
            onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            onOpenAuditLogs={() => setIsAuditLogOpen(true)}
            activeTab={analystTab}
            onTabChange={setAnalystTab}
            onUpdateCountsAndSchedule={handleUpdateCountsAndSchedule}
            onStatusChange={handleAnalystStatusChange}
            onTriggerEmailNotification={handleTriggerEmailNotification}
          />
        )}

        {/* SECONDARY VIEW: DELIVERABLES & FILE GATE AUDITOR (Collapsible or Expandable) */}
        {showFileGatesAuditor && (
          <div className="border-t-2 border-stone-300 pt-6 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-stone-700" />
                  Waterfall Deliverables &amp; Phase Gates Auditor
                </h3>
                <p className="text-xs text-stone-500">
                  Inspect underlying physical BRD, SRS, code freezes, UAT test logs, and release runbooks in{' '}
                  <code className="font-mono text-stone-800">{targetPath}</code>
                </p>
              </div>
            </div>

            {/* Executive Summary Cards */}
            <ExecutiveSummary
              report={report}
              onFilterStatus={(st) => setStatusFilter(st)}
              onOpenScaffold={() => setShowScaffoldModal(true)}
              targetPath={targetPath}
            />

            {/* Sequential Phase Gates Pipeline */}
            <PhasePipeline
              phases={report.phases}
              selectedPhase={selectedPhase}
              onSelectPhase={(phase) => setSelectedPhase(phase)}
            />

            {/* Detailed Deliverables Audit Table */}
            <DeliverablesTable
              results={report.results}
              unmatchedFiles={report.unmatchedFiles}
              activePhase={selectedPhase}
              activeStatusFilter={statusFilter}
              onStatusFilterChange={(st) => setStatusFilter(st)}
              onSelectDeliverable={(item) => setInspectedItem(item)}
              onSelectUnmatchedFile={handleSelectUnmatchedFile}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">eGRC Requirements Waterfall</span>
            <span>•</span>
            <span>Dual-Persona Governance &amp; Quantitative Flow Control</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Drive Parity: H:\My Drive\Waterfall
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-stone-600">
              <FolderOpen className="w-3.5 h-3.5 text-stone-400" />
              Role: <strong className="uppercase font-bold">{userRole}</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* Consolidated Real-Time Activity Audit Log Drawer */}
      <AuditLogDrawer
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        logs={auditLogs}
      />

      {/* Inspect / Upload Deliverable Modal */}
      {inspectedItem && (
        <DeliverableModal
          item={inspectedItem}
          onClose={() => setInspectedItem(null)}
          onAttachFile={handleAttachSingleFile}
        />
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <ReportExportModal
          report={report}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Custom Rules Editor Modal */}
      {showRulesModal && (
        <RulesEditorModal
          deliverables={deliverables}
          onSave={(newRules) => setDeliverables(newRules)}
          onReset={() => setDeliverables(DEFAULT_DELIVERABLES)}
          onClose={() => setShowRulesModal(false)}
        />
      )}

      {/* Scaffold Missing Files Modal */}
      {showScaffoldModal && (
        <ScaffoldModal
          missingItems={report.results.filter((r) => r.status === 'missing')}
          targetPath={targetPath}
          projectName="Waterfall Project Alpha"
          onClose={() => setShowScaffoldModal(false)}
          onDirectoryScaffoldSuccess={(paths) => handleDirectoryScaffoldSuccess(paths)}
        />
      )}

      {/* Refresh All Analytical Steps Email Dispatch Modal */}
      <RefreshDataModal
        rows={waterfallRows}
        isOpen={showRefreshModal}
        onClose={() => setShowRefreshModal(false)}
        onConfirmRefresh={handleConfirmRefreshData}
      />

      {/* Option 1: Add Waterfall Modal (only prompts for Waterfall Name) */}
      <AddWaterfallModal
        isOpen={isAddWaterfallOpen}
        onClose={() => setIsAddWaterfallOpen(false)}
        currentProject={projectDetails}
        onAddWaterfall={handleAddWaterfall}
      />

      {/* Option 2: Create Brand New Project Modal (prompts for full project spec + waterfall) */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreateProject={handleCreateNewProject}
      />
    </div>
  );
}
